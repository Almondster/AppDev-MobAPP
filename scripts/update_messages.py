import sys

file_path = r'c:\Academics\AppDev-MobAPP\app\(tabs)\message.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);'''

replacement1 = '''  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = auth.currentUser;
  const [role, setRole] = useState<'client' | 'creator'>('client');'''

if target1 in content:
    content = content.replace(target1, replacement1)
else:
    print("WARNING: target1 not found!")

target2 = '''  useEffect(() => {
    setTimeout(() => {
      setThreads(MOCK_THREADS);
      setFilteredThreads(MOCK_THREADS);
      setLoading(false);
    }, 600);
  }, []);'''

replacement2 = '''  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const { data: userData } = await supabase.from('users').select('role').eq('firebase_uid', user.uid).single();
        const currentRole = userData?.role || 'client';
        if (isMounted) setRole(currentRole);

        if (currentRole === 'creator') {
          if (isMounted) {
            setThreads([]);
            setFilteredThreads([]);
          }
        } else {
          const clientThreads = [
            {
              partnerId: 'user-2',
              partnerName: 'Sarah Jenkins',
              partnerAvatar: null,
              lastMessage: 'Sarah Jenkins sent you a message.',
              lastMessageTime: new Date(Date.now() - 30 * 60000),
              unreadCount: 1,
            },
            {
              partnerId: 'system',
              partnerName: 'System',
              partnerAvatar: null,
              lastMessage: 'CreaTech has been updated with new features. Check them out!',
              lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60000),
              unreadCount: 0,
            }
          ];
          if (isMounted) {
            setThreads(clientThreads);
            setFilteredThreads(clientThreads);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMessages();
    return () => { isMounted = false; };
  }, [user]);'''

if target2 in content:
    content = content.replace(target2, replacement2)
else:
    print("WARNING: target2 not found or already replaced!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated message.tsx')
