const OWNER = "kokim80-maker";

// 고정 노출 대상 5개 저장소. GitHub description이 비어있는 경우가 많아
// 각 저장소 README를 확인해 작성한 한줄 요약을 사용한다.
const TARGET_REPOS = [
  { name: "airport", summary: "인천공항 입출국장 혼잡도를 조회하고 자주 보는 시간대를 즐겨찾기로 저장하는 대시보드" },
  { name: "recipe", summary: "냉장고 사진으로 식재료를 인식해 만들 수 있는 레시피를 추천하고 저장하는 웹 앱" },
  { name: "econo", summary: "바쁜 직장인·주부가 매일 5~10분씩 오늘의 경제 핵심과 흐름을 파악하고, 관련 주식 업종·기업까지 자연스럽게 연결해서 학습하는 서비스" },
  { name: "order", summary: "디저트 가게 메뉴를 담아 주문하고 본인 주문 내역을 조회하는 서비스" },
  { name: "alram", summary: "간단한 알람" },
];

module.exports = async (req, res) => {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    res.status(500).json({ error: "GITHUB_TOKEN 환경변수가 설정되지 않았습니다." });
    return;
  }

  try {
    const results = await Promise.all(
      TARGET_REPOS.map(async (target) => {
        const ghResponse = await fetch(`https://api.github.com/repos/${OWNER}/${target.name}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });

        if (!ghResponse.ok) {
          return { name: target.name, failed: true, status: ghResponse.status };
        }

        const repo = await ghResponse.json();
        return {
          owner: repo.owner.login,
          name: repo.name,
          description: target.summary,
          homepage: repo.homepage || "",
          html_url: repo.html_url,
          pushedAt: repo.pushed_at,
          topics: repo.topics || [],
        };
      })
    );

    const ok = results.filter((r) => !r.failed);
    const failed = results.filter((r) => r.failed);

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).json({ repos: ok, failed });
  } catch (err) {
    res.status(500).json({ error: "예기치 못한 오류", detail: String(err) });
  }
};
