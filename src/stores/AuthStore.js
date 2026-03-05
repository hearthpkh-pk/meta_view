import { globalState } from './StateManager.js'
import { db } from '../utils/database.js'

/**
 * Constants for Auth State Keys
 */
export const AUTH_KEYS = {
    USER: 'auth:user',
    EMPLOYEE: 'auth:employee',
    SESSION: 'auth:session',
    LOADING: 'auth:loading',
    ERROR: 'auth:error'
}

/**
 * Auth Store - Manages authentication state and business logic
 */
class AuthStore {
    constructor() {
        this.initialized = false;

        // Make sure we have initial states set nicely
        globalState.setState(AUTH_KEYS.LOADING, true);
        globalState.setState(AUTH_KEYS.USER, null);
        globalState.setState(AUTH_KEYS.EMPLOYEE, null);
        globalState.setState(AUTH_KEYS.ERROR, null);
    }

    /**
     * Initialize Supabase Auth listeners
     */
    async init() {
        if (this.initialized) return;

        try {
            globalState.setState(AUTH_KEYS.LOADING, true);

            // 1. Get initial session on load
            const { data: { session }, error } = await db.auth.getSession();

            if (error) throw error;

            await this.handleSessionUpdate(session);

            // 2. Listen for auth changes (login, logout, token refresh)
            db.auth.onAuthStateChange(async (_event, session) => {
                console.log(`[AuthStore] Auth event: ${_event}`);

                // Don't re-fetch everything extensively unless it's a new login or logout
                if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'TOKEN_REFRESHED' || _event === 'INITIAL_SESSION') {
                    await this.handleSessionUpdate(session);
                }
            });

            this.initialized = true;
            console.log('✅ AuthStore initialized');

        } catch (error) {
            console.error('❌ AuthStore initialization failed:', error);
            globalState.setState(AUTH_KEYS.ERROR, error.message);
        } finally {
            globalState.setState(AUTH_KEYS.LOADING, false);
        }
    }

    /**
     * Process and store session & employee data
     */
    async handleSessionUpdate(session) {
        globalState.setState(AUTH_KEYS.SESSION, session);

        if (session?.user) {
            globalState.setState(AUTH_KEYS.USER, session.user);

            // Fetch additional employee data (Role)
            await this.fetchEmployeeProfile(session.user.id);
        } else {
            // Clear data on logout
            globalState.setBatchState({
                [AUTH_KEYS.USER]: null,
                [AUTH_KEYS.EMPLOYEE]: null,
                [AUTH_KEYS.ERROR]: null
            });
        }
    }

    /**
     * Fetch Employee Role and Profile from DB
     */
    async fetchEmployeeProfile(userId) {
        try {
            const { data, error } = await db
                .from('employees')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // Handle case where user is in auth.users but not in public.employees
                if (error.code === 'PGRST116') {
                    console.warn('⚠️ User profile not found in employees table. Contact Admin.');
                    globalState.setState(AUTH_KEYS.EMPLOYEE, { role: 'guest', is_active: false });
                } else {
                    throw error;
                }
            } else {
                globalState.setState(AUTH_KEYS.EMPLOYEE, data);
            }
        } catch (error) {
            console.error('Failed to fetch employee profile:', error);
            globalState.setState(AUTH_KEYS.ERROR, 'ไม่สามารถดึงข้อมูลสิทธิ์การใช้งานได้');
        }
    }

    /**
     * Action: Login
     */
    async login(email, password) {
        globalState.setState(AUTH_KEYS.LOADING, true);
        globalState.setState(AUTH_KEYS.ERROR, null);

        try {
            const { data, error } = await db.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return data;
        } catch (error) {
            globalState.setState(AUTH_KEYS.ERROR, error.message);
            throw error;
        } finally {
            globalState.setState(AUTH_KEYS.LOADING, false);
        }
    }

    /**
     * Action: Logout
     */
    async logout() {
        globalState.setState(AUTH_KEYS.LOADING, true);
        try {
            const { error } = await db.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        } finally {
            globalState.setState(AUTH_KEYS.LOADING, false);
        }
    }

    // ---- Getters for Convenience ----

    isAuthenticated() {
        return !!globalState.getState(AUTH_KEYS.USER);
    }

    getRole() {
        return globalState.getState(AUTH_KEYS.EMPLOYEE)?.role || 'guest';
    }

    hasRole(allowedRoles = []) {
        if (!allowedRoles || allowedRoles.length === 0) return true;
        return allowedRoles.includes(this.getRole());
    }

    getUser() {
        return globalState.getState(AUTH_KEYS.USER);
    }

    getEmployeeProfile() {
        return globalState.getState(AUTH_KEYS.EMPLOYEE);
    }

    isLoading() {
        return globalState.getState(AUTH_KEYS.LOADING);
    }
}

// Export singleton instance
export const authStore = new AuthStore();
