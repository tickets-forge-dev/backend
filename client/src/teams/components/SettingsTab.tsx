import type { Team } from '../services/team.service';
import { TeamSettings } from './TeamSettings';

interface SettingsTabProps {
  team: Team;
}

/**
 * SettingsTab Component
 *
 * Team settings tab that wraps the existing TeamSettings component:
 * - Team name edit
 * - Allow member invites checkbox
 * - Delete team (danger zone)
 */
export function SettingsTab({ team }: SettingsTabProps) {
  return (
    <div>
      <TeamSettings />
    </div>
  );
}
