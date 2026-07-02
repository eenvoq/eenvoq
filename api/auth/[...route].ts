import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import { performTransactionalRegistration } from '../../server/onboardingService';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

function normalizeRole(role: unknown) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'manager' || normalized === 'staff' || normalized === 'owner' ? normalized : 'owner';
}

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

async function ensureProfileRecord(userId: string, businessId: string, fullName: string, email: string, role = 'owner') {
  if (!supabaseAdmin) return null;
  try {
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile?.id) {
      return existingProfile;
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        business_id: businessId,
        full_name: fullName,
        email,
        role: normalizeRole(role),
        online: true,
        last_active: new Date().toISOString(),
        is_active: true
      })
      .select('id')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Supabase profile sync skipped in Vercel route.', error);
    return null;
  }
}

async function upsertBusinessProfile(userId: string, config: Record<string, any> = {}, role = 'owner') {
  if (!supabaseAdmin) return null;
  try {
    const businessPayload = {
      name: config?.name || 'Your Business',
      industry: config?.industry || 'Business',
      subtype: config?.subtype || '',
      location: config?.location || '',
      currency: config?.currency || 'USD ($)',
      contact_email: config?.contactEmail || config?.email || '',
      contact_phone: config?.contactPhone || '',
      modules: config?.modules || ['transactions', 'inventory', 'customers', 'staff', 'reports', 'ai'],
      logo_url: config?.logoUrl || ''
    };

    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('business_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileData?.business_id) {
      await supabaseAdmin.from('businesses').update(businessPayload).eq('id', profileData.business_id);
      return profileData.business_id;
    }

    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert(businessPayload)
      .select('id')
      .single();

    if (businessError) throw businessError;
    await ensureProfileRecord(userId, businessData.id, config?.fullName || 'Business Owner', config?.email || '', role);
    return businessData.id;
  } catch (error) {
    console.warn('Supabase business sync skipped in Vercel route.', error);
    return null;
  }
}

export const config = {
  runtime: 'nodejs'
};

export default async function handler(req: IncomingMessage & { method?: string; url?: string; body?: any }, res: ServerResponse) {
  const requestUrl = new URL(req.url || '/', `https://${req.headers.host || 'app.eenvoq.com.ng'}`);
  const pathname = requestUrl.pathname;

  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, message: 'Eenvoq auth API is running.' });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 404, { error: 'Route not found.' });
  }

  const body = await readJson(req);

  if (pathname === '/api/auth/signup') {
    const { email, password, fullName, organizationConfig, role, pin } = body || {};
    if (!email || !password) {
      return sendJson(res, 400, { error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRole = normalizeRole(role);
    const normalizedPin = String(pin || '').trim();
    if (normalizedRole !== 'owner' && normalizedPin.length < 4) {
      return sendJson(res, 400, { error: 'A 4-digit PIN is required for manager and staff accounts.' });
    }

    if (!supabaseAuth) {
      return sendJson(res, 500, { error: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.' });
    }

    try {
      const result = await performTransactionalRegistration({
        email: normalizedEmail,
        password: String(password),
        fullName: String(fullName || '').trim() || 'Business Owner',
        organizationConfig,
        role: normalizedRole,
        pin: normalizedPin
      });

      return sendJson(res, 200, {
        message: 'Account created successfully.',
        user: result.user,
        profile: result.profile,
        business: result.business
      });
    } catch (error: any) {
      const message = error?.message || 'Unable to create account.';
      console.error('Vercel signup error', error);
      if (message.includes('already exists')) {
        return sendJson(res, 409, { error: message });
      }
      if (message.includes('valid email') || message.includes('business name') || message.includes('industry') || message.includes('location') || message.includes('currency') || message.includes('account type')) {
        return sendJson(res, 400, { error: message });
      }
      return sendJson(res, 500, { error: message });
    }
  }

  if (pathname === '/api/auth/login') {
    const { email, password, role, pin } = body || {};
    if (!email || !password) {
      return sendJson(res, 400, { error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRole = normalizeRole(role);
    const normalizedPin = String(pin || '').trim();
    if (normalizedRole !== 'owner' && normalizedPin.length < 4) {
      return sendJson(res, 401, { error: 'A 4-digit PIN is required for manager and staff accounts.' });
    }

    if (!supabaseAuth) {
      return sendJson(res, 500, { error: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.' });
    }

    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: normalizedEmail,
        password: String(password)
      });

      if (error || !data.user) {
        return sendJson(res, 401, { error: error?.message || 'Incorrect email or password.' });
      }

      return sendJson(res, 200, {
        message: 'Signed in successfully.',
        user: data.user,
        session: data.session,
        profile: {
          full_name: data.user.user_metadata?.full_name || 'Business Owner',
          email: normalizedEmail,
          role: normalizedRole
        },
        business: null
      });
    } catch (error: any) {
      console.error('Vercel login error', error);
      return sendJson(res, 500, { error: error?.message || 'Unable to sign in.' });
    }
  }

  return sendJson(res, 404, { error: 'Route not found.' });
}
