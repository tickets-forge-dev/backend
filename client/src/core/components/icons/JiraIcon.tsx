/**
 * Official Jira Icon
 * Based on Atlassian's official Jira branding
 */
export function JiraIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Jira blue icon - official style */}
      <rect width="128" height="128" rx="24" fill="#0052CC" />
      <path
        d="M64 24C42.9 24 25 41.9 25 63C25 84.1 42.9 102 64 102C85.1 102 103 84.1 103 63C103 41.9 85.1 24 64 24ZM64 96C46.3 96 31 80.7 31 63C31 45.3 46.3 30 64 30C81.7 30 97 45.3 97 63C97 80.7 81.7 96 64 96Z"
        fill="white"
      />
      <path
        d="M64 42C54.1 42 46 50.1 46 60C46 69.9 54.1 78 64 78C73.9 78 82 69.9 82 60C82 50.1 73.9 42 64 42ZM64 72C58.5 72 54 67.5 54 62C54 56.5 58.5 52 64 52C69.5 52 74 56.5 74 62C74 67.5 69.5 72 64 72Z"
        fill="white"
      />
    </svg>
  );
}
