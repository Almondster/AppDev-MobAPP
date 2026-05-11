import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { fetchServices, fetchUsers } from '../../frontend/api';
import { auth } from '../../frontend/session';
import { supabase } from '../../frontend/store';

export const useHomeData = () => {
  const user = auth.currentUser;
  
  const [userName, setUserName] = useState(user?.displayName?.split(' ')[0] || 'User');
  const [userAvatar, setUserAvatar] = useState<string | null>(user?.photoURL || null);
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [creatorServices, setCreatorServices] = useState<any[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [hasMatches, setHasMatches] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        if (user) {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('firebase_uid', user.uid)
            .single();
          if (data?.role) setRole(data.role);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
      } finally {
        setRoleLoading(false);
      }
    };
    fetchRole();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          if (user) {
            const { data: userData } = await supabase
              .from('users')
              .select('full_name, avatar_url') 
              .eq('firebase_uid', user.uid)
              .single();
            
            if (userData) {
               if (userData.full_name) setUserName(userData.full_name.split(' ')[0]);
               if (userData.avatar_url) setUserAvatar(userData.avatar_url);
            }

            const { data: blocks } = await supabase
                .from('blocks')
                .select('blocked_id')
                .eq('blocker_id', user.uid);
            
            if (blocks) {
                setBlockedIds(blocks.map(b => b.blocked_id));
            }
          }

          const { data: catsData } = await supabase
            .from('categories')
            .select('*')
            .order('id', { ascending: true });
            
          if (catsData) {
            setMainCategories(catsData);
          }

          const { data: creatorsData } = await supabase
            .from('users')
            .select('firebase_uid, full_name, avatar_url, role')
            .eq('role', 'creator')
            .limit(15);

          if (creatorsData && creatorsData.length > 0) {
              const creatorIds = creatorsData.map(c => c.firebase_uid);
              const { data: reviewsData } = await supabase
                  .from('reviews')
                  .select('reviewee_id, rating')
                  .in('reviewee_id', creatorIds);

              const creatorsWithWeightedScore = creatorsData.map(creator => {
                  const creatorReviews = reviewsData?.filter(r => r.reviewee_id === creator.firebase_uid) || [];
                  const totalRating = creatorReviews.reduce((acc, curr) => acc + curr.rating, 0);
                  const avgRating = creatorReviews.length > 0 
                      ? (totalRating / creatorReviews.length) 
                      : 0;
                  const reviewCount = creatorReviews.length;

                  const finalScore = reviewCount === 0 ? 0 : avgRating + (reviewCount * 0.1);

                  return {
                      ...creator,
                      calculated_rating: reviewCount > 0 ? avgRating.toFixed(1) : 'New',
                      review_count: reviewCount,
                      numeric_rating: avgRating,
                      weighted_score: finalScore,
                  };
              });

              const sortedCreators = creatorsWithWeightedScore.sort((a, b) => b.weighted_score - a.weighted_score);
              setCreators(sortedCreators.slice(0, 5)); 
          }

          if (user) {
             const { data: matchesData } = await supabase
               .from('matches')
               .select('creator_id, created_at')
               .eq('client_id', user.uid)
               .order('created_at', { ascending: false })
               .limit(10);

             let uniqueIds: string[] = [];

             if (matchesData && matchesData.length > 0) {
                uniqueIds = [...new Set(matchesData.map((m: any) => String(m.creator_id)))] as string[];
                uniqueIds = uniqueIds.slice(0, 5);
             } 

             if (uniqueIds.length > 0) {
                const { data: matchUserDetails } = await supabase
                    .from('users')
                    .select(`
                        firebase_uid, 
                        full_name, 
                        avatar_url, 
                        role, 
                        creators (
                            bio,
                            starting_price,
                            skills
                        )
                    `)
                    .in('firebase_uid', uniqueIds);
                
                const { data: matchReviews } = await supabase
                    .from('reviews')
                    .select('reviewee_id, rating')
                    .in('reviewee_id', uniqueIds);

                if (matchUserDetails) {
                    const formattedMatches = matchUserDetails.map((m: any) => {
                        const userReviews = matchReviews?.filter(r => r.reviewee_id === m.firebase_uid) || [];
                        const totalRating = userReviews.reduce((acc: number, curr: any) => acc + curr.rating, 0);
                        const avg = userReviews.length > 0 ? (totalRating / userReviews.length).toFixed(1) : 'New';
                        
                        const skills = m.creators?.[0]?.skills;
                        const skillsText = Array.isArray(skills) && skills.length > 0
                            ? skills.slice(0, 2).join(' • ') 
                            : m.role || 'Creator';
                        const matchEntry = matchesData?.find((match: any) => match.creator_id === m.firebase_uid);
                        const matchTime = matchEntry ? new Date(matchEntry.created_at).getTime() : 0;

                        return {
                            id: m.firebase_uid,
                            full_name: m.full_name,
                            role: m.role,
                            rating: avg, 
                            skillsText: skillsText,
                            description: m.creators?.[0]?.bio || 'Professional Creator',
                            avatar_url: m.avatar_url,
                            matchTime: matchTime
                        };
                    });

                    const sortedMatches = formattedMatches.sort((a, b) => b.matchTime - a.matchTime);
                    
                    setRecentMatches(sortedMatches);
                    setHasMatches(true);
                }
             } else {
                setHasMatches(false);
                setRecentMatches([]);
             }
          }

          try {
            const [servicesResponse, usersResponse] = await Promise.all([
              fetchServices(),
              fetchUsers(),
            ]);

            const servicesRows = servicesResponse?.results || servicesResponse || [];
            const usersRows = usersResponse?.results || usersResponse || [];
            const usersById = new Map(
              usersRows.map((row: any) => [
                String(row.id || row.firebase_uid),
                {
                  ...row,
                  firebase_uid: String(row.firebase_uid || row.id),
                  full_name: row.full_name || row.username || row.email?.split('@')[0] || 'Creator',
                },
              ])
            );

            const formattedServices = servicesRows
              .filter((service: any) => service.creator_id != null)
              .filter((service: any) => service.is_public !== false)
              .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
              .slice(0, 10)
              .map((service: any) => {
                const creatorId = String(service.creator_id);
                return {
                  id: String(service.id),
                  title: service.title,
                  description: service.description,
                  price: service.price == null ? 'Negotiable' : String(service.price),
                  image_url: service.image_url,
                  label: service.label || service.category || 'General',
                  creator: usersById.get(creatorId) || null,
                  creator_id: creatorId,
                  created_at: service.created_at,
                };
              });

            setCreatorServices(formattedServices);
          } catch (servicesError) {
            console.error('Error fetching creator services from backend:', servicesError);
            setCreatorServices([]);
          }

        } catch (err: any) {
          console.error('Error fetching home data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [user])
  );

  return {
    userName,
    userAvatar,
    mainCategories,
    creators,
    recentMatches,
    creatorServices,
    blockedIds,
    loading,
    role,
    roleLoading,
    hasMatches,
  };
};

