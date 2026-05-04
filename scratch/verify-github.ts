import "dotenv/config";
import { fetchUserRepos } from "../lib/github";

async function main() {
  const repos = await fetchUserRepos("aeyakovenko");
  const solanaRepo = repos.find(r => r.name === "solana");
  console.log("Solana Repo Issues:", solanaRepo?.openIssues);
  console.log("All Repos:", repos.map(r => ({ name: r.name, issues: r.openIssues })));
}

main();
