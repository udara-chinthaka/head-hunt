import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useOrgMembership = () => {
  const { user } = useAuth();
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setIsMember(false);
        setLoading(false);
        setCheckedUserId(null);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) throw error;
        setIsMember(!!data && data.length > 0);
        setCheckedUserId(user.id);
      } catch (err) {
        console.error('Error checking org membership:', err);
        setIsMember(false);
        setCheckedUserId(user.id);
      } finally {
        setLoading(false);
      }
    };

    checkMembership();
  }, [user]);

  return { isMember, loading, checkedUserId };
};
