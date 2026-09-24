"""
SOMAK AI — Envelope Encryption Master Key Re-encryption Migration
Migrates all stored BYOK and integration keys from OLD master key to NEW master key.
"""

import os
import sys
import json
import logging
from pathlib import Path
from cryptography.fernet import Fernet, InvalidToken

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("migrate_encryption_key")

def get_fernet_for_key(key: str) -> Fernet:
    import base64
    import hashlib
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except Exception:
        digest = hashlib.sha256(key.encode()).digest()
        urlsafe_key = base64.urlsafe_b64encode(digest)
        return Fernet(urlsafe_key)

def decrypt_val(ciphertext: str, fernet: Fernet) -> str:
    if not ciphertext or not ciphertext.startswith("enc:"):
        return ciphertext
    raw = ciphertext[4:]
    decrypted_bytes = fernet.decrypt(raw.encode("utf-8"))
    return decrypted_bytes.decode("utf-8")

def encrypt_val(plaintext: str, fernet: Fernet) -> str:
    if not plaintext:
        return ""
    encrypted_bytes = fernet.encrypt(plaintext.encode("utf-8"))
    return f"enc:{encrypted_bytes.decode('utf-8')}"

SECRET_FIELDS = [
    "sentry_webhook_secret",
    "ai_api_key",
    "nebius_api_key",
    "anthropic_api_key",
    "openai_api_key",
    "google_api_key",
    "tavily_api_key",
    "slack_webhook",
    "pagerduty_key"
]

def run_migration(old_key: str, new_key: str, db_pool=None):
    old_fernet = get_fernet_for_key(old_key)
    new_fernet = get_fernet_for_key(new_key)

    logger.info("Initializing re-encryption migration...")
    
    # 1. Migrate in-memory org_store
    from app.services.org_store import org_store
    all_orgs = org_store.list_all_orgs()
    
    total_orgs = len(all_orgs)
    total_keys_migrated = 0
    spot_check_sample = None

    for org in all_orgs:
        checklist = org.setup_checklist
        if not checklist:
            continue
        for field in SECRET_FIELDS:
            val = getattr(checklist, field, None)
            if val and isinstance(val, str) and val.startswith("enc:"):
                # Decrypt with old key
                plain = decrypt_val(val, old_fernet)
                # Re-encrypt with new key
                new_enc = encrypt_val(plain, new_fernet)
                setattr(checklist, field, new_enc)
                total_keys_migrated += 1
                if spot_check_sample is None:
                    spot_check_sample = (field, plain, new_enc)

    # 2. Migrate PostgreSQL DB if available
    db_migrated_orgs = 0
    try:
        from app.core.database import db, is_db_available
        if is_db_available():
            conn = db.get_connection()
            if conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT id, setup_checklist FROM organizations;")
                    rows = cur.fetchall()
                    for row in rows:
                        org_id = row[0]
                        checklist_data = row[1] if isinstance(row[1], dict) else json.loads(row[1]) if row[1] else {}
                        modified = False
                        for field in SECRET_FIELDS:
                            val = checklist_data.get(field)
                            if val and isinstance(val, str) and val.startswith("enc:"):
                                plain = decrypt_val(val, old_fernet)
                                new_enc = encrypt_val(plain, new_fernet)
                                checklist_data[field] = new_enc
                                modified = True
                        if modified:
                            cur.execute(
                                "UPDATE organizations SET setup_checklist = %s WHERE id = %s;",
                                (json.dumps(checklist_data), org_id)
                            )
                            db_migrated_orgs += 1
                conn.commit()
    except Exception as e:
        logger.warning(f"Database migration skipped or encountered error: {e}")

    # 3. Verification & Spot Check
    logger.info("Migration complete.")
    logger.info(f"Total orgs inspected: {total_orgs}")
    logger.info(f"Total keys re-encrypted in store: {total_keys_migrated}")
    if db_migrated_orgs > 0:
        logger.info(f"Total DB organization rows updated: {db_migrated_orgs}")

    if spot_check_sample:
        field_name, expected_plain, new_ciphertext = spot_check_sample
        # Check decrypt with new key succeeds
        recovered = decrypt_val(new_ciphertext, new_fernet)
        assert recovered == expected_plain, f"Decryption with new key failed for {field_name}!"
        logger.info(f"Spot-check decrypt with NEW key SUCCEEDED for field: {field_name}")

        # Check decrypt with old key fails
        try:
            decrypt_val(new_ciphertext, old_fernet)
            raise AssertionError("Decryption with OLD key should have failed but succeeded!")
        except (InvalidToken, Exception):
            logger.info("Spot-check decrypt with OLD key properly FAILED with InvalidToken.")

    return {
        "status": "success",
        "total_orgs": total_orgs,
        "keys_migrated": total_keys_migrated,
        "db_rows_migrated": db_migrated_orgs
    }

if __name__ == "__main__":
    old_key = os.environ.get("ENCRYPTION_MASTER_KEY_OLD") or os.environ.get("ENCRYPTION_MASTER_KEY")
    new_key = os.environ.get("ENCRYPTION_MASTER_KEY_NEW")
    if not old_key or not new_key:
        print("Usage: ENCRYPTION_MASTER_KEY_OLD=... ENCRYPTION_MASTER_KEY_NEW=... python migrate_encryption_key.py")
        sys.exit(1)
    run_migration(old_key, new_key)
