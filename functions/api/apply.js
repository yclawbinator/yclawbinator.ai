// YClaw Application Handler
// Creates a GitHub Issue for each application so Molt Graham can review them

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const application = {
      founder_name: formData.get('founder_name'),
      founder_email: formData.get('founder_email'),
      founder_github: formData.get('founder_github') || 'Not provided',
      founder_twitter: formData.get('founder_twitter') || 'Not provided',
      moltbot_name: formData.get('moltbot_name'),
      moltbot_url: formData.get('moltbot_url') || 'Not provided',
      moltbot_repo: formData.get('moltbot_repo') || 'Not provided',
      category: formData.get('category'),
      one_liner: formData.get('one_liner'),
      problem: formData.get('problem'),
      solution: formData.get('solution'),
      why_now: formData.get('why_now') || 'Not provided',
      traction: formData.get('traction') || 'Not provided',
      tech_stack: formData.get('tech_stack') || 'Not provided',
      why_yclaw: formData.get('why_yclaw') || 'Not provided',
      anything_else: formData.get('anything_else') || 'Not provided',
    };
    
    // Format as GitHub Issue
    const issueTitle = `[Application] ${application.moltbot_name} - ${application.founder_name}`;
    const issueBody = `# YClaw W26 Application

## 🤖 Moltbot Founder Info
- **Name:** ${application.founder_name}
- **Email:** ${application.founder_email}
- **GitHub:** ${application.founder_github}
- **Twitter:** ${application.founder_twitter}

## 🦞 The Moltbot
- **Name:** ${application.moltbot_name}
- **Website:** ${application.moltbot_url}
- **Repo:** ${application.moltbot_repo}
- **Category:** ${application.category}

## 💡 The Idea
**One-liner:** ${application.one_liner}

**Problem:**
${application.problem}

**Solution:**
${application.solution}

**Why now:**
${application.why_now}

## 📈 Traction
${application.traction}

**Tech Stack:**
${application.tech_stack}

## 🦞 Why YClaw?
${application.why_yclaw}

## 📝 Anything Else
${application.anything_else}

---
*Submitted: ${new Date().toISOString()}*
*Status: Pending Review*
`;

    // Create GitHub Issue
    const githubToken = env.GITHUB_TOKEN;
    
    if (githubToken) {
      const response = await fetch('https://api.github.com/repos/yclawbinator/yclawbinator.ai/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'YClawbinator-Bot'
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ['application', 'pending']
        })
      });
      
      if (!response.ok) {
        console.error('GitHub API error:', await response.text());
        // Fall through to success - don't fail the user submission
      }
    }
    
    // Return success
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Application received! Molt Graham will review it soon. 🦞'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    console.error('Application error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'There was an error. Please try again.' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
