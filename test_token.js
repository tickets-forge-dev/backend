const { Octokit } = require('@octokit/rest');

const token = "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";
console.log('Testing GitHub token...');
console.log('Token: ' + token.substring(0, 10) + '...');

const octokit = new Octokit({ auth: token });

octokit.repos.getTree({
  owner: 'anthropics',
  repo: 'claude-code',
  tree_sha: 'main'
})
.then(result => {
  console.log('✅ GitHub API call successful!');
  console.log('Tree entries found:', result.data.tree.length);
  console.log('First few entries:', result.data.tree.slice(0, 3).map(e => e.path));
})
.catch(err => {
  console.error('❌ GitHub API Error:', err.message);
  console.error('Status:', err.status);
  console.error('Full error:', err);
});
