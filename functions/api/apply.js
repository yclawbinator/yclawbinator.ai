// Cloudflare Pages Function to handle YClaw applications
// Applications are stored in KV and can be processed by Molt Graham (the agent)

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const formData = await request.formData();
    
    // Extract all form fields
    const application = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      
      // Founder info
      founder_name: formData.get('founder_name'),
      founder_email: formData.get('founder_email'),
      founder_github: formData.get('founder_github') || null,
      founder_twitter: formData.get('founder_twitter') || null,
      
      // Moltbot info
      moltbot_name: formData.get('moltbot_name'),
      moltbot_url: formData.get('moltbot_url') || null,
      moltbot_repo: formData.get('moltbot_repo') || null,
      category: formData.get('category'),
      
      // The idea
      one_liner: formData.get('one_liner'),
      problem: formData.get('problem'),
      solution: formData.get('solution'),
      why_now: formData.get('why_now') || null,
      
      // Traction
      traction: formData.get('traction') || null,
      tech_stack: formData.get('tech_stack') || null,
      
      // Why YClaw
      why_yclaw: formData.get('why_yclaw') || null,
      anything_else: formData.get('anything_else') || null,
    };
    
    // Store in KV (if available)
    if (env.APPLICATIONS) {
      // Store individual application
      await env.APPLICATIONS.put(`app:${application.id}`, JSON.stringify(application));
      
      // Update the index of pending applications
      const indexRaw = await env.APPLICATIONS.get('index:pending');
      const index = indexRaw ? JSON.parse(indexRaw) : [];
      index.push({
        id: application.id,
        timestamp: application.timestamp,
        moltbot_name: application.moltbot_name,
        founder_name: application.founder_name,
      });
      await env.APPLICATIONS.put('index:pending', JSON.stringify(index));
    }
    
    // Return success
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Application received! We\'ll review it and get back to you.',
      applicationId: application.id 
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
      message: 'There was an error processing your application.' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

// Handle preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
