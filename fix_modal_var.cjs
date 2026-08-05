const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const stateStr = `
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/super-admin/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (e) {
      console.error('Kullanıcılar alınamadı', e);
    }
  };
  
  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAllUsers();
    }
  }, [isAdminLoggedIn]);
`;

if (!code.includes('const [showUsersModal, setShowUsersModal]')) {
    code = code.replace("  const [isAiChatOpen, setIsAiChatOpen] = useState(false);", "  const [isAiChatOpen, setIsAiChatOpen] = useState(false);" + stateStr);
    fs.writeFileSync('src/App.tsx', code);
    console.log('patched vars');
} else {
    console.log('already has vars');
}
