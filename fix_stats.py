import re

path = r'd:\PROJECT\SentryOps\frontend\src\components\landing\LandingPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'<div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pt-8 border-t border-slate-200 dark:border-white/10">.*?Guaranteed by Sandbox test gates.*?</div>.*?</div>',
    r'''<div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pt-8 border-t border-slate-200 dark:border-white/10">
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                100%
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#181614] dark:text-white">
                Sandboxed
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                All patches run in isolated containers
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-cyan-600 dark:text-cyan-400">
                AST
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#181614] dark:text-white">
                Validated
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                No hallucinated syntax errors
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-indigo-600 dark:text-indigo-400">
                Manual
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#181614] dark:text-white">
                Approval
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Humans remain in control
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono text-violet-600 dark:text-violet-400">
                Canary
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#181614] dark:text-white">
                Rollouts
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Traffic splits with auto-rollback
              </div>
            </div>
          </div>''',
    content,
    flags=re.DOTALL
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
