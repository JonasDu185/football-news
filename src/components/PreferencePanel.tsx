import { useState } from 'react'
import { XIcon, ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const LEAGUE_OPTIONS = ['英超', '西甲', '德甲', '意甲', '法甲', '欧冠', '中超', '国家队']

export interface UserPreferences {
  leagues: string[]
  teams: string[]
}

interface PreferencePanelProps {
  preferences: UserPreferences
  onSave: (prefs: UserPreferences) => void
  onClose: () => void
}

export { LEAGUE_OPTIONS }

export function PreferencePanel({ preferences, onSave, onClose }: PreferencePanelProps) {
  const [leagues, setLeagues] = useState<string[]>([...preferences.leagues])
  const [teamInput, setTeamInput] = useState('')
  const [teams, setTeams] = useState<string[]>([...preferences.teams])

  const toggleLeague = (league: string) => {
    setLeagues((prev) =>
      prev.includes(league) ? prev.filter((l) => l !== league) : [...prev, league],
    )
  }

  const addTeam = () => {
    const name = teamInput.trim()
    if (name && !teams.includes(name)) {
      setTeams((prev) => [...prev, name])
    }
    setTeamInput('')
  }

  const removeTeam = (team: string) => {
    setTeams((prev) => prev.filter((t) => t !== team))
  }

  const handleSave = () => {
    onSave({ leagues, teams })
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* 顶栏 */}
      <div className="flex items-center gap-2 px-2 py-3 border-b border-border">
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
          <ArrowLeftIcon className="size-4" />
        </Button>
        <span className="text-sm font-medium flex-1">偏好设置</span>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <p className="text-xs text-muted-foreground mb-2">选择联赛</p>
          <div className="flex flex-wrap gap-2">
            {LEAGUE_OPTIONS.map((league) => (
              <button
                key={league}
                type="button"
                onClick={() => toggleLeague(league)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  leagues.includes(league)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {league}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">关注球队</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTeam()}
              placeholder="输入球队名后回车"
              className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 outline-none placeholder:text-muted-foreground"
            />
            <Button variant="outline" size="sm" onClick={addTeam}>
              添加
            </Button>
          </div>
          {teams.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {teams.map((team) => (
                <span
                  key={team}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                >
                  {team}
                  <button onClick={() => removeTeam(team)} className="text-muted-foreground hover:text-foreground">
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部 */}
      <div className="px-4 py-3 border-t border-border">
        <Button className="w-full" size="sm" onClick={handleSave}>
          保存偏好
        </Button>
      </div>
    </div>
  )
}
