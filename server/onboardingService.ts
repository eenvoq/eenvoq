import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface OrganizationConfigInput {
  profileType?: string;
  name?: string;
  industry?: string;
  subtype?: string;
  location?: string;
  currency?: string;
  contactEmail?: string;
  contactPhone?: string;
  staffCount?: number;
  modules?: string[];
  logoUrl?: string;
}

export interface RegistrationInput {
  email: string;
  password: string;
  fullName?: string;
  organizationConfig?: OrganizationConfigInput;
  role?: string;
  pin?: string;
}

interface CreatedResources {
  authUserId: string | null;
  businessId: string | null;
  profileId: string | null;
  settingsId: string | null;
  preferencesId: string | null;
  dashboardConfigId: string | null;
  categoryIds: string[];
  roleIds: string[];
  permissionIds: string[];
  aiConfigId: string | null;
  notificationPreferencesId: string | null;
}

interface RegistrationResult {
  user: Record<string, unknown> | null;
  session?: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  business: Record<string, unknown> | null;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

const authClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

const adminClient = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

function normalizeRole(role?: string) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'manager' || normalized === 'staff' || normalized === 'owner' ? normalized : 'owner';
}

function normalizeAccountType(profileType?: string) {
  return 'business';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateRegistrationInput(input: RegistrationInput) {
  const normalizedEmail = String(input.email || '').trim().toLowerCase();
  const normalizedPassword = String(input.password || '');
  const fullName = String(input.fullName || '').trim();
  const organizationConfig = input.organizationConfig || {};
  const normalizedRole = normalizeRole(input.role);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  if (normalizedPassword.length < 8 || !/[A-Za-z]/.test(normalizedPassword) || !/\d/.test(normalizedPassword)) {
    return { valid: false, error: 'Password must be at least 8 characters long and include letters and numbers.' };
  }

  if (fullName.length < 2) {
    return { valid: false, error: 'Please enter your full name.' };
  }

  if (!String(organizationConfig.name || '').trim()) {
    return { valid: false, error: 'Please provide your business name.' };
  }

  if (!String(organizationConfig.industry || '').trim()) {
    return { valid: false, error: 'Please provide your industry.' };
  }

  if (!String(organizationConfig.location || '').trim()) {
    return { valid: false, error: 'Please provide your business location.' };
  }

  if (!String(organizationConfig.currency || '').trim()) {
    return { valid: false, error: 'Please provide your currency.' };
  }

  if (String(organizationConfig.profileType || 'business').toLowerCase() !== 'business') {
    return { valid: false, error: 'Please select a valid business account type.' };
  }

  if (normalizedRole !== 'owner' && String(input.pin || '').trim().length < 4) {
    return { valid: false, error: 'A 4-digit PIN is required for manager and staff accounts.' };
  }

  return { valid: true, normalizedEmail, normalizedPassword, fullName, normalizedRole };
}

async function checkEmailAvailability(email: string) {
  if (!adminClient) {
    return false;
  }

  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    throw error;
  }

  const users = data?.users as Array<{ email?: string }> | undefined;
  return users?.some((user) => user.email?.toLowerCase() === email.toLowerCase()) || false;
}

function getUserClient(accessToken?: string | null): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured.');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  if (accessToken) {
    client.auth.setSession({ access_token: accessToken, refresh_token: '' });
  }

  return client;
}

function buildDefaultInitializationPayload(businessId: string, profileId: string, ownerEmail: string, ownerName: string) {
  const createdAt = new Date().toISOString();
  return {
    businessId,
    profileId,
    ownerEmail,
    ownerName,
    createdAt
  };
}

async function insertInitializationRecords(
  client: SupabaseClient,
  businessId: string,
  profileId: string,
  ownerEmail: string,
  ownerName: string,
  resources: CreatedResources
) {
  const now = new Date().toISOString();
  const initializationPayload = buildDefaultInitializationPayload(businessId, profileId, ownerEmail, ownerName);

  const { data: settingsData, error: settingsError } = await client
    .from('business_settings')
    .insert({
      business_id: businessId,
      timezone: 'UTC',
      currency: 'USD ($)',
      locale: 'en-US',
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single();

  if (settingsError) throw settingsError;
  resources.settingsId = settingsData?.id || null;

  const { data: preferencesData, error: preferencesError } = await client
    .from('application_preferences')
    .insert({
      business_id: businessId,
      theme: 'light',
      language: 'en',
      default_view: 'dashboard',
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single();

  if (preferencesError) throw preferencesError;
  resources.preferencesId = preferencesData?.id || null;

  const { data: dashboardConfigData, error: dashboardConfigError } = await client
    .from('dashboard_configurations')
    .insert({
      business_id: businessId,
      layout: 'default',
      widgets: ['overview', 'inventory', 'orders', 'customers'],
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single();

  if (dashboardConfigError) throw dashboardConfigError;
  resources.dashboardConfigId = dashboardConfigData?.id || null;

  const categoryNames = ['General', 'Operations', 'Sales', 'Inventory'];
  for (let index = 0; index < categoryNames.length; index += 1) {
    const categoryName = categoryNames[index];
    const { data: categoryData, error: categoryError } = await client
      .from('default_categories')
      .insert({
        business_id: businessId,
        name: categoryName,
        category_type: 'custom',
        sort_order: index + 1,
        created_at: now,
        updated_at: now
      })
      .select('id')
      .single();

    if (categoryError) throw categoryError;
    if (categoryData?.id) {
      resources.categoryIds.push(categoryData.id);
    }
  }

  const { data: ownerRoleData, error: ownerRoleError } = await client
    .from('operator_roles')
    .insert({
      business_id: businessId,
      name: 'Owner',
      description: 'Primary business owner',
      is_system_default: true,
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single();

  if (ownerRoleError) throw ownerRoleError;
  if (ownerRoleData?.id) {
    resources.roleIds.push(ownerRoleData.id);
  }

  const { data: managerRoleData, error: managerRoleError } = await client
    .from('operator_roles')
    .insert({
      business_id: businessId,
      name: 'Manager',
      description: 'Operational manager',
      is_system_default: true,
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single();

  if (managerRoleError) throw managerRoleError;
  if (managerRoleData?.id) {
    resources.roleIds.push(managerRoleData.id);
  }

  const rolePermissionMap = [
    { roleId: ownerRoleData?.id, feature: 'dashboard', action: 'read' },
    { roleId: ownerRoleData?.id, feature: 'inventory', action: 'write' },
    { roleId: ownerRoleData?.id, feature: 'orders', action: 'write' },
    { roleId: ownerRoleData?.id, feature: 'customers', action: 'write' },
    { roleId: managerRoleData?.id, feature: 'dashboard', action: 'read' },
    { roleId: managerRoleData?.id, feature: 'inventory', action: 'read' },
    { roleId: managerRoleData?.id, feature: 'orders', action: 'write' }
  ];

  for (const permission of rolePermissionMap) {
    if (!permission.roleId) continue;
    const { data: permissionData, error: permissionError } = await client
      .from('permissions')
      .insert({
        business_id: businessId,
        role_id: permission.roleId,
        feature: permission.feature,
        action: permission.action,
        created_at: now,
        updated_at: now
      })
      .select('id')
      .single();

    if (permissionError) throw permissionError;
    if (permissionData?.id) {
      resources.permissionIds.push(permissionData.id);
    }
  }

  const { data: aiConfigData, error: aiConfigError } = await client
    .from('ai_configurations')
    .insert({
      business_id: businessId,
      provider: 'openai',
      model: 'gpt-4o-mini',
      enabled: true,
      default_prompt: `Welcome ${ownerName} to your dashboard.`,
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single();

  if (aiConfigError) throw aiConfigError;
  resources.aiConfigId = aiConfigData?.id || null;

  const { data: notificationData, error: notificationError } = await client
    .from('notification_preferences')
    .insert({
      business_id: businessId,
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false,
      created_at: now,
      updated_at: now
    })
    .select('id')
    .single();

  if (notificationError) throw notificationError;
  resources.notificationPreferencesId = notificationData?.id || null;

  return initializationPayload;
}

async function rollbackResources(resources: CreatedResources) {
  if (!adminClient) return;

  try {
    if (resources.notificationPreferencesId) {
      await adminClient.from('notification_preferences').delete().eq('id', resources.notificationPreferencesId);
    }
  } catch (error) {
    console.warn('Rollback: notification_preferences cleanup failed', error);
  }

  try {
    if (resources.aiConfigId) {
      await adminClient.from('ai_configurations').delete().eq('id', resources.aiConfigId);
    }
  } catch (error) {
    console.warn('Rollback: ai_configurations cleanup failed', error);
  }

  try {
    for (const permissionId of resources.permissionIds) {
      await adminClient.from('permissions').delete().eq('id', permissionId);
    }
  } catch (error) {
    console.warn('Rollback: permissions cleanup failed', error);
  }

  try {
    for (const roleId of resources.roleIds) {
      await adminClient.from('operator_roles').delete().eq('id', roleId);
    }
  } catch (error) {
    console.warn('Rollback: operator_roles cleanup failed', error);
  }

  try {
    for (const categoryId of resources.categoryIds) {
      await adminClient.from('default_categories').delete().eq('id', categoryId);
    }
  } catch (error) {
    console.warn('Rollback: default_categories cleanup failed', error);
  }

  try {
    if (resources.dashboardConfigId) {
      await adminClient.from('dashboard_configurations').delete().eq('id', resources.dashboardConfigId);
    }
  } catch (error) {
    console.warn('Rollback: dashboard_configurations cleanup failed', error);
  }

  try {
    if (resources.preferencesId) {
      await adminClient.from('application_preferences').delete().eq('id', resources.preferencesId);
    }
  } catch (error) {
    console.warn('Rollback: application_preferences cleanup failed', error);
  }

  try {
    if (resources.settingsId) {
      await adminClient.from('business_settings').delete().eq('id', resources.settingsId);
    }
  } catch (error) {
    console.warn('Rollback: business_settings cleanup failed', error);
  }

  try {
    if (resources.businessId) {
      await adminClient.from('businesses').delete().eq('id', resources.businessId);
    }
  } catch (error) {
    console.warn('Rollback: businesses cleanup failed', error);
  }

  try {
    if (resources.profileId) {
      await adminClient.from('profiles').delete().eq('id', resources.profileId);
    }
  } catch (error) {
    console.warn('Rollback: profiles cleanup failed', error);
  }

  try {
    if (resources.authUserId) {
      await adminClient.auth.admin.deleteUser(resources.authUserId);
    }
  } catch (error) {
    console.warn('Rollback: auth user cleanup failed', error);
  }
}

export async function performTransactionalRegistration(
  input: RegistrationInput,
  logger: Pick<Console, 'error' | 'warn'> = console
): Promise<RegistrationResult> {
  const validated = validateRegistrationInput(input);
  if (!validated.valid) {
    throw new Error(validated.error);
  }

  const normalizedEmail = validated.normalizedEmail;
  const fullName = validated.fullName;
  const normalizedRole = validated.normalizedRole;
  const config = input.organizationConfig || {};

  try {
    const availability = await checkEmailAvailability(normalizedEmail);
    if (availability) {
      throw new Error('An account with this email address already exists. Please sign in or use a different email address.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    logger.error('Email availability check failed', error);
    throw new Error('Unable to validate the email address right now. Please try again.');
  }

  if (!authClient || !adminClient) {
    throw new Error('Supabase is not configured.');
  }

  const resources: CreatedResources = {
    authUserId: null,
    businessId: null,
    profileId: null,
    settingsId: null,
    preferencesId: null,
    dashboardConfigId: null,
    categoryIds: [],
    roleIds: [],
    permissionIds: [],
    aiConfigId: null,
    notificationPreferencesId: null
  };

  try {
    const { data: signupData, error: signupError } = await authClient.auth.signUp({
      email: normalizedEmail,
      password: String(input.password),
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: undefined
      }
    });

    if (signupError) {
      if (String(signupError.message).toLowerCase().includes('already')) {
        throw new Error('An account with this email address already exists. Please sign in or use a different email address.');
      }
      throw signupError;
    }

    const authenticatedUser = signupData?.user;
    if (!authenticatedUser?.id) {
      throw new Error('Authentication did not return a valid user ID.');
    }

    resources.authUserId = authenticatedUser.id;

    const accessToken = signupData.session?.access_token;
    const userClient = getUserClient(accessToken);

    const businessPayload = {
      name: String(config.name || '').trim() || 'Your Business',
      account_type: normalizeAccountType(String(config.profileType || 'business')),
      industry: String(config.industry || '').trim() || 'Business',
      subtype: String(config.subtype || '').trim() || '',
      location: String(config.location || '').trim() || '',
      currency: String(config.currency || '').trim() || 'USD ($)',
      contact_email: String(config.contactEmail || normalizedEmail).trim(),
      contact_phone: String(config.contactPhone || '').trim(),
      modules: Array.isArray(config.modules) && config.modules.length > 0 ? config.modules : ['transactions', 'inventory', 'customers', 'staff', 'reports', 'ai'],
      logo_url: String(config.logoUrl || '').trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: businessData, error: businessError } = await userClient
      .from('businesses')
      .insert(businessPayload)
      .select('id')
      .single();

    if (businessError) {
      throw businessError;
    }

    resources.businessId = businessData?.id || null;

    const { data: profileData, error: profileError } = await userClient
      .from('profiles')
      .insert({
        user_id: authenticatedUser.id,
        business_id: resources.businessId,
        tenant_id: resources.businessId,
        account_type: normalizeAccountType(String(config.profileType || 'business')),
        full_name: fullName,
        email: normalizedEmail,
        role: normalizedRole,
        online: true,
        last_active: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (profileError) {
      throw profileError;
    }

    resources.profileId = profileData?.id || null;

    await insertInitializationRecords(userClient, resources.businessId, resources.profileId, normalizedEmail, fullName, resources);

    return {
      user: authenticatedUser as unknown as Record<string, unknown>,
      session: signupData.session as unknown as Record<string, unknown> | null,
      profile: profileData as unknown as Record<string, unknown> | null,
      business: businessData as unknown as Record<string, unknown> | null
    };
  } catch (error) {
    await rollbackResources(resources);
    if (error instanceof Error) {
      logger.error('Transactional registration failed', error);
      throw error;
    }
    logger.error('Transactional registration failed', error);
    throw new Error('We could not complete your registration. Please try again.');
  }
}
