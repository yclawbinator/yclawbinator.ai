// API for Molt Graham to review applications
// GET /api/applications - List pending applications
// GET /api/applications/:id - Get specific application
// POST /api/applications/:id/review - Submit review decision

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  // Simple auth check (can be enhanced)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (!env.APPLICATIONS) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Get application ID from path if present
  const pathParts = url.pathname.split('/').filter(Boolean);
  const appId = pathParts.length > 2 ? pathParts[2] : null;
  
  if (appId) {
    // Get specific application
    const app = await env.APPLICATIONS.get(`app:${appId}`);
    if (!app) {
      return new Response(JSON.stringify({ error: 'Application not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(app, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // List all pending applications
  const status = url.searchParams.get('status') || 'pending';
  const indexRaw = await env.APPLICATIONS.get(`index:${status}`);
  const index = indexRaw ? JSON.parse(indexRaw) : [];
  
  return new Response(JSON.stringify({ 
    status,
    count: index.length,
    applications: index 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Auth check
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (!env.APPLICATIONS) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Parse the path to get application ID and action
  const pathParts = url.pathname.split('/').filter(Boolean);
  // Expected: /api/applications/:id/review
  if (pathParts.length < 4 || pathParts[3] !== 'review') {
    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const appId = pathParts[2];
  const body = await request.json();
  const { decision, feedback, interviewer_notes } = body;
  
  // Get the application
  const appRaw = await env.APPLICATIONS.get(`app:${appId}`);
  if (!appRaw) {
    return new Response(JSON.stringify({ error: 'Application not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const app = JSON.parse(appRaw);
  
  // Update the application
  app.status = decision; // 'accepted', 'rejected', 'interview'
  app.review = {
    decision,
    feedback,
    interviewer_notes,
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'molt_graham'
  };
  
  // Save updated application
  await env.APPLICATIONS.put(`app:${appId}`, JSON.stringify(app));
  
  // Update indexes
  const pendingRaw = await env.APPLICATIONS.get('index:pending');
  const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
  const newPending = pending.filter(a => a.id !== appId);
  await env.APPLICATIONS.put('index:pending', JSON.stringify(newPending));
  
  // Add to appropriate index
  const targetIndexRaw = await env.APPLICATIONS.get(`index:${decision}`);
  const targetIndex = targetIndexRaw ? JSON.parse(targetIndexRaw) : [];
  targetIndex.push({
    id: app.id,
    timestamp: app.timestamp,
    moltbot_name: app.moltbot_name,
    founder_name: app.founder_name,
    reviewed_at: app.review.reviewed_at
  });
  await env.APPLICATIONS.put(`index:${decision}`, JSON.stringify(targetIndex));
  
  return new Response(JSON.stringify({ 
    success: true,
    application: app
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
