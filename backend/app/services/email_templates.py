"""
SOMAK AI — Responsive Transactional Email Templates
Styled to match the Porcelain/Obsidian design system with HTML and plain-text fallbacks.
"""

from typing import Literal

def _base_email_layout(title: str, content_html: str, preheader: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a {{ font-family: Arial, Helvetica, sans-serif !important; }}
  </style>
  <![endif]-->
  <style type="text/css">
    body {{
      margin: 0;
      padding: 0;
      background-color: #F8FAFC;
      color: #0F172A;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }}
    .email-container {{
      max-width: 580px;
      margin: 40px auto;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05);
    }}
    .email-header {{
      padding: 32px 36px 24px;
      border-bottom: 1px solid #F1F5F9;
      background: #FAFAFA;
    }}
    .email-body {{
      padding: 36px;
      line-height: 1.6;
      font-size: 15px;
      color: #334155;
    }}
    .email-btn {{
      display: inline-block;
      background-color: #4F46E5;
      color: #FFFFFF !important;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
      margin: 24px 0 16px;
    }}
    .email-footer {{
      padding: 24px 36px;
      background: #F8FAFC;
      border-top: 1px solid #F1F5F9;
      font-size: 12px;
      color: #94A3B8;
      text-align: center;
    }}
    .badge {{
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      font-family: monospace;
    }}
    .badge-purple {{
      background: #F3E8FF;
      color: #7E22CE;
      border: 1px solid #E9D5FF;
    }}
    .badge-green {{
      background: #ECFDF5;
      color: #047857;
      border: 1px solid #A7F3D0;
    }}
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    {preheader}
  </div>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 20px 10px;">
    <tr>
      <td align="center">
        <div class="email-container">
          <!-- Brand Header -->
          <div class="email-header">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="left">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="width: 36px; height: 36px; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 10px; text-align: center; vertical-align: middle; color: #FFFFFF; font-weight: bold; font-size: 18px;">
                        S
                      </td>
                      <td style="padding-left: 12px; font-size: 18px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">
                        SOMAK AI
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right" style="font-size: 11px; font-family: monospace; color: #64748B; font-weight: 600;">
                  AUTONOMOUS CLOUD SRE
                </td>
              </tr>
            </table>
          </div>

          <!-- Main Email Content -->
          <div class="email-body">
            {content_html}
          </div>

          <!-- Footer -->
          <div class="email-footer">
            <p style="margin: 0 0 6px;">
              © 2026 SOMAK AI Inc. • Autonomous Site Reliability & AST Remediation
            </p>
            <p style="margin: 0; font-size: 11px;">
              Security verified for SOC-2 Type II. If you did not request this email, you can safely disregard it.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>"""

def render_welcome_email(user_name: str, user_email: str, dashboard_url: str = "https://app.somak.ai") -> dict:
    subject = "Welcome to SOMAK AI — Autonomous SRE for your production services"
    preheader = "Your autonomous incident remediation workspace is ready."
    
    html = _base_email_layout(
        title=subject,
        preheader=preheader,
        content_html=f"""
          <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 16px; letter-spacing: -0.5px;">
            Welcome aboard, {user_name}!
          </h2>
          <p>
            Your SOMAK AI account is fully provisioned under <strong style="color: #0F172A;">{user_email}</strong>.
            You now have access to sub-minute automated crash triage, zero-hallucination AST hotfix synthesis, and canary gate governance.
          </p>
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 24px 0;">
            <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">
              3 Quick Steps to Zero Downtime:
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
              <li style="margin-bottom: 6px;">Connect your Sentry inbound webhook in Settings</li>
              <li style="margin-bottom: 6px;">Configure your preferred LLM provider (NVIDIA Nemotron / OpenAI)</li>
              <li>Invite team members to participate in canary deployment gates</li>
            </ul>
          </div>
          <div style="text-align: center;">
            <a href="{dashboard_url}" class="email-btn">Launch Incident Radar →</a>
          </div>
          <p style="font-size: 13px; color: #64748B; margin-top: 24px;">
            Need assistance setting up telemetry? Reply directly to this email or visit our <a href="https://app.somak.ai/docs" style="color: #4F46E5; text-decoration: none; font-weight: 600;">Documentation Hub</a>.
          </p>
        """
    )

    text = f"""Welcome to SOMAK AI, {user_name}!

Your account has been provisioned under {user_email}.
Launch your Incident Radar workspace: {dashboard_url}

3 Quick Steps to Zero Downtime:
1. Connect your Sentry inbound webhook
2. Configure your LLM provider (NVIDIA Nemotron)
3. Invite your SRE team members

Documentation: https://app.somak.ai/docs
© 2026 SOMAK AI Inc.
"""
    return {"subject": subject, "html": html, "text": text}

def render_team_invite_email(
    inviter_name: str,
    org_name: str,
    role: str,
    invite_url: str,
    expires_in_days: int = 7
) -> dict:
    subject = f"{inviter_name} invited you to join {org_name} on SOMAK AI"
    preheader = f"Join {org_name} on SOMAK AI as {role}."
    badge_class = "badge-purple" if role == "Admin" else "badge-green"

    html = _base_email_layout(
        title=subject,
        preheader=preheader,
        content_html=f"""
          <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 14px; letter-spacing: -0.5px;">
            Join {org_name} on SOMAK AI
          </h2>
          <p>
            <strong style="color: #0F172A;">{inviter_name}</strong> has invited you to collaborate in the
            <strong style="color: #0F172A;">{org_name}</strong> workspace.
          </p>
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 22px 0;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td style="font-size: 13px; color: #64748B;">Assigned Role:</td>
                <td align="right">
                  <span class="badge {badge_class}">{role}</span>
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #64748B; padding-top: 8px;">Token Validity:</td>
                <td align="right" style="font-size: 13px; font-weight: 600; color: #0F172A; padding-top: 8px;">
                  Expires in {expires_in_days} days
                </td>
              </tr>
            </table>
          </div>
          <div style="text-align: center;">
            <a href="{invite_url}" class="email-btn">Accept Invitation & Join →</a>
          </div>
          <p style="font-size: 12px; color: #94A3B8; margin-top: 24px; text-align: center; word-break: break-all;">
            Or copy and paste this link into your browser:<br>
            <span style="color: #4F46E5;">{invite_url}</span>
          </p>
        """
    )

    text = f"""{inviter_name} invited you to join {org_name} on SOMAK AI.

Role: {role}
Expires: In {expires_in_days} days

Accept invitation: {invite_url}

© 2026 SOMAK AI Inc.
"""
    return {"subject": subject, "html": html, "text": text}

def render_email_verification(user_name: str, verification_code: str, verification_url: str) -> dict:
    subject = "Verify your email for SOMAK AI"
    preheader = f"Your verification code is {verification_code}."

    html = _base_email_layout(
        title=subject,
        preheader=preheader,
        content_html=f"""
          <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 14px; letter-spacing: -0.5px;">
            Verify your email address
          </h2>
          <p>
            Hello {user_name}, please enter the verification code below to verify your email address and activate your SOMAK AI workspace.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4F46E5; background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 12px 28px;">
              {verification_code}
            </div>
          </div>
          <div style="text-align: center;">
            <a href="{verification_url}" class="email-btn">Verify Account Online →</a>
          </div>
          <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
            This security code will expire in 15 minutes.
          </p>
        """
    )

    text = f"""Verify your email for SOMAK AI, {user_name}:

Your verification code is: {verification_code}
Or verify online: {verification_url}

Expires in 15 minutes.
© 2026 SOMAK AI Inc.
"""
    return {"subject": subject, "html": html, "text": text}

def render_password_reset(user_name: str, reset_url: str, expires_in_minutes: int = 30) -> dict:
    subject = "Reset your SOMAK AI password"
    preheader = "A request was received to reset your password."

    html = _base_email_layout(
        title=subject,
        preheader=preheader,
        content_html=f"""
          <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 14px; letter-spacing: -0.5px;">
            Password Reset Request
          </h2>
          <p>
            Hello {user_name}, we received a request to reset the password associated with your SOMAK AI account.
          </p>
          <div style="text-align: center;">
            <a href="{reset_url}" class="email-btn">Reset Password →</a>
          </div>
          <p style="font-size: 13px; color: #64748B;">
            This link is valid for {expires_in_minutes} minutes. If you did not make this request, you can safely ignore this email; your credentials remain secure.
          </p>
          <p style="font-size: 12px; color: #94A3B8; margin-top: 24px; word-break: break-all;">
            Direct reset link:<br>
            <span style="color: #4F46E5;">{reset_url}</span>
          </p>
        """
    )

    text = f"""Password Reset Request for SOMAK AI:

Hello {user_name}, reset your password here:
{reset_url}

Link expires in {expires_in_minutes} minutes.
© 2026 SOMAK AI Inc.
"""
    return {"subject": subject, "html": html, "text": text}

def render_email(template_type: str, **kwargs) -> dict:
    t = template_type.lower().strip()
    if t in ("welcome", "welcome_email"):
        return render_welcome_email(
            user_name=kwargs.get("user_name", "Sarah Connor"),
            user_email=kwargs.get("user_email", "sarah@cyberdyne.io"),
            dashboard_url=kwargs.get("dashboard_url", "https://app.somak.ai/radar")
        )
    elif t in ("team_invite", "invite"):
        return render_team_invite_email(
            inviter_name=kwargs.get("inviter_name", "Alex Rivera"),
            org_name=kwargs.get("org_name", "Acme Production Core"),
            role=kwargs.get("role", "Engineer"),
            invite_url=kwargs.get("invite_url", "https://app.somak.ai/invite/inv_demo9912"),
            expires_in_days=kwargs.get("expires_in_days", 7)
        )
    elif t in ("email_verification", "verify", "verification"):
        return render_email_verification(
            user_name=kwargs.get("user_name", "Elena Rostova"),
            verification_code=kwargs.get("verification_code", "748-291"),
            verification_url=kwargs.get("verification_url", "https://app.somak.ai/verify?token=tok_demo842")
        )
    elif t in ("password_reset", "reset", "forgot_password"):
        return render_password_reset(
            user_name=kwargs.get("user_name", "Marcus Vance"),
            reset_url=kwargs.get("reset_url", "https://app.somak.ai/reset-password?token=rst_demo5519"),
            expires_in_minutes=kwargs.get("expires_in_minutes", 30)
        )
    else:
        raise ValueError(f"Unknown email template type: {template_type}. Available: welcome, team_invite, email_verification, password_reset")

