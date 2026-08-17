import asyncio
import logging
import httpx
from typing import Dict, Any, Optional, List
from services.embedding_service import embed_text_with_source, cosine_similarity

logger = logging.getLogger("sourcing_service")

EXTERNAL_SCRAPER_BASE_URL = "https://social_scraper.bytemap.in"


async def fetch_github_profile(github_id: str) -> Dict[str, Any]:
    """
    Fetch GitHub profile details, pinned/recent repositories, and AI repo summaries
    from social_scraper.bytemap.in/github/{github_id}.
    """
    if not github_id or not github_id.strip():
        return {"success": False, "error": "GitHub ID cannot be empty"}

    clean_id = github_id.strip().lstrip("@")
    url = f"{EXTERNAL_SCRAPER_BASE_URL}/github/{clean_id}"

    try:
        async with httpx.AsyncClient(timeout=15.0, verify=False, follow_redirects=True) as client:

            resp = await client.get(url)
            if resp.status_code == 404:
                return {"success": False, "error": f"GitHub user '{clean_id}' not found"}
            resp.raise_for_status()
            data = resp.json()

            profile = data.get("profile", {})
            recent_repos = data.get("recent_repositories", [])
            pinned_repos = data.get("pinned_repositories", [])


            repo_languages = list({r.get("language") for r in recent_repos + pinned_repos if r.get("language")})
            
            return {
                "success": True,
                "platform": "github",
                "username": profile.get("username", clean_id),
                "name": profile.get("name") or clean_id,
                "bio": profile.get("bio", ""),
                "location": profile.get("location", ""),
                "website": profile.get("website", ""),
                "followers": profile.get("followers"),
                "following": profile.get("following"),
                "contributions_last_year": profile.get("contributions_last_year"),
                "repositories": recent_repos[:10],
                "pinned_repositories": pinned_repos,
                "extracted_skills": repo_languages,
                "raw_data": data,
            }
    except Exception as e:
        logger.error(f"Failed to fetch GitHub profile for {clean_id}: {e}")
        return {"success": False, "error": f"Failed to fetch GitHub profile: {str(e)}"}


async def fetch_linkedin_profile(linkedin_id: str) -> Dict[str, Any]:
    """
    Fetch LinkedIn profile details, experiences, skills, and recent activity
    from social_scraper.bytemap.in/linkedin/{linkedin_id}.
    """
    if not linkedin_id or not linkedin_id.strip():
        return {"success": False, "error": "LinkedIn ID cannot be empty"}

    clean_id = linkedin_id.strip().split("/")[-1].lstrip("@")
    url = f"{EXTERNAL_SCRAPER_BASE_URL}/linkedin/{clean_id}"

    try:
        async with httpx.AsyncClient(timeout=15.0, verify=False, follow_redirects=True) as client:

            resp = await client.get(url)
            if resp.status_code == 404:
                return {"success": False, "error": f"LinkedIn user '{clean_id}' not found"}
            resp.raise_for_status()
            data = resp.json()

            profile = data.get("profile", {})
            posts = data.get("posts", [])
            skills = profile.get("skills", [])
            experiences = profile.get("experiences", [])

            return {
                "success": True,
                "platform": "linkedin",
                "username": clean_id,
                "name": profile.get("name") or clean_id,
                "headline": profile.get("headline", ""),
                "location": profile.get("location", ""),
                "about": profile.get("about", ""),
                "profile_pic": profile.get("profile_pic", ""),
                "experiences": experiences,
                "education": profile.get("education", []),
                "extracted_skills": skills,
                "posts": posts[:5],
                "raw_data": data,
            }
    except Exception as e:
        logger.error(f"Failed to fetch LinkedIn profile for {clean_id}: {e}")
        return {"success": False, "error": f"Failed to fetch LinkedIn profile: {str(e)}"}


async def aggregate_external_profile(
    github_id: Optional[str] = None,
    linkedin_id: Optional[str] = None,
    job_description: str = "",
    target_role: str = ""
) -> Dict[str, Any]:
    """
    Fetch GitHub and/or LinkedIn candidate profiles concurrently, aggregate skills and experience,
    generate a 768-dim vector embedding, and compute job match similarity.
    """
    tasks = []
    if github_id:
        tasks.append(fetch_github_profile(github_id))
    else:
        tasks.append(asyncio.sleep(0, result={"success": False}))

    if linkedin_id:
        tasks.append(fetch_linkedin_profile(linkedin_id))
    else:
        tasks.append(asyncio.sleep(0, result={"success": False}))

    gh_res, li_res = await asyncio.gather(*tasks)



    name = None
    headline = ""
    bio_summary = ""
    all_skills = set()
    sources = []

    if gh_res.get("success"):
        sources.append("github")
        name = gh_res.get("name") or name
        bio_summary += f"GitHub Bio: {gh_res.get('bio')}\n"
        all_skills.update(gh_res.get("extracted_skills", []))


        for r in gh_res.get("repositories", [])[:3]:
            if r.get("summary"):
                bio_summary += f"Project {r.get('name')}: {r.get('summary')}\n"

    if li_res.get("success"):
        sources.append("linkedin")
        name = li_res.get("name") or name
        headline = li_res.get("headline", "")
        bio_summary += f"LinkedIn Headline: {headline}\nAbout: {li_res.get('about')}\n"
        all_skills.update(li_res.get("extracted_skills", []))


    profile_text = f"Candidate: {name}. Headline: {headline}. Skills: {', '.join(all_skills)}. Bio: {bio_summary}"
    profile_vector, profile_source = embed_text_with_source(profile_text)





    similarity_score = None
    if job_description or target_role:
        target_text = f"{target_role}. {job_description}".strip()
        job_vector, job_source = embed_text_with_source(target_text)
        if profile_source == "onnx" and job_source == "onnx":
            cosine_sim = cosine_similarity(profile_vector, job_vector)
            similarity_score = round(max(0.0, min(100.0, cosine_sim * 100.0)), 1)

    return {
        "success": len(sources) > 0,
        "candidate": {
            "name": name,
            "headline": headline,
            "github": gh_res if gh_res.get("success") else None,
            "linkedin": li_res if li_res.get("success") else None,
            "sources": sources,
            "extracted_skills": list(all_skills),
            "profile_text": profile_text,
            "embedding_dimensions": len(profile_vector),
            "similarity_score": similarity_score,
        }
    }
