import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type UserRole = 'admin' | 'customer' | 'vendor' | 'delivery';

interface UserProfile {
    id: string;
    full_name: string;
    role: UserRole;
    avatar_url?: string;
}

interface AuthContextType {
    session: Session | null;
    user: any | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAdmin: boolean;
    isDeliveryMan: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
    isDeliveryMan: false,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, retryCount = 0) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(); // returns null (not error) when 0 rows

            if (error) {
                console.error('Error fetching profile:', error);
            } else if (!data && retryCount < 3) {
                // Profile not yet committed (signup race condition) — retry after delay
                setTimeout(() => fetchProfile(userId, retryCount + 1), 800);
                return;
            } else {
                setProfile(data);
            }
        } catch (e) {
            console.error('Exception fetching profile:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const isAdmin = profile?.role === 'admin';
    const isDeliveryMan = profile?.role === 'delivery';

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, isLoading, isAdmin, isDeliveryMan, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
