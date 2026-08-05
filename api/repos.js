module.exports = async (req, res) => {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    res.status(500).json({ error: "GITHUB_TOKEN 환경변수가 설정되지 않았습니다." });
    return;
  }

  try {
    const ghResponse = await fetch(
      "https://api.github.com/user/repos?sort=pushed&direction=desc&per_page=100&affiliation=owner",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!ghResponse.ok) {
      const detail = await ghResponse.text();
      res.status(ghResponse.status).json({ error: "GitHub API 요청 실패", detail });
      return;
    }

    const repos = await ghResponse.json();

    const top5 = repos
      .filter((r) => !r.archived && !r.disabled)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 5)
      .map((r) => ({
        owner: r.owner.login,
        name: r.name,
        description: r.description || "",
        homepage: r.homepage || "",
        html_url: r.html_url,
        pushedAt: r.pushed_at,
        topics: r.topics || [],
      }));

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).json(top5);
  } catch (err) {
    res.status(500).json({ error: "예기치 못한 오류", detail: String(err) });
  }
};
