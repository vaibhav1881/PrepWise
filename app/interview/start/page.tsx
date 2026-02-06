'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RoleSelectionPage() {
  const router = useRouter();
  const [view, setView] = useState<'select' | 'create'>('select');
  const [section, setSection] = useState<'my' | 'public'>('my');
  const [publicTab, setPublicTab] = useState<'popular' | 'recent'>('popular');
  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadRoles();
  }, [section, publicTab, search]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id : null;
      
      const params = new URLSearchParams();
      if (userId && section === 'my') params.append('user_id', userId);
      
      if (section === 'my') {
        params.append('category', 'my');
      } else {
        params.append('category', publicTab);
      }
      
      if (search) params.append('search', search);

      const response = await fetch(`/api/roles/list?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const startWithRole = async (role: any) => {
    setLoading(true);
    try {
      const startResponse = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id, 
          role_id: role._id
        }),
      });

      const startData = await startResponse.json();
      if (startResponse.ok) {
        router.push(`/interview/${startData.interview_id}`);
      }
    } catch (err) {
      console.error('Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (e: React.MouseEvent, role: any) => {
    e.stopPropagation();
    
    try {
      const newVisibility = role.visibility === 'public' ? 'private' : 'public';
      const response = await fetch('/api/roles/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role_id: role._id,
          visibility: newVisibility,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        loadRoles();
      } else {
        const error = await response.json();
        console.error('Failed to update visibility:', error.message);
      }
    } catch (err) {
      console.error('Failed to update visibility');
    }
  };

  const deleteRole = async (e: React.MouseEvent, role: any) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${role.title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/roles/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role_id: role._id,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        loadRoles();
      } else {
        const error = await response.json();
        alert('Failed to delete role: ' + error.message);
      }
    } catch (err) {
      alert('Failed to delete role');
    }
  };

  if (view === 'create') {
    router.push('/interview/start/create');
    return null;
  }

  function renderRolesList() {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      );
    }
    
    if (roles.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {section === 'my' ? "You haven't created any roles yet." : 'No roles found.'}
          </p>
          <Button onClick={() => router.push('/interview/start/create')}>
            Create Your First Role
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const isOwner = user && user.id === role.creator_id;
          const isMyRolesTab = section === 'my';
          const canToggleVisibility = isOwner && isMyRolesTab;
          
          return (
            <div
              key={role._id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer relative bg-card"
              onClick={() => startWithRole(role)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold flex-1 pr-2">{role.title}</h3>
                {!canToggleVisibility && (
                  <span className={`px-2 py-1 text-xs rounded ${
                    role.visibility === 'public' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {role.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                  </span>
                )}
              </div>
              
              {canToggleVisibility && (
                <div className="mb-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(e, role);
                    }}
                    className={`flex-1 px-2 py-2 text-xs rounded border-2 transition-all ${
                      role.visibility === 'public'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    {role.visibility === 'public' && '✓ '}
                    Public
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(e, role);
                    }}
                    className={`flex-1 px-2 py-2 text-xs rounded border-2 transition-all ${
                      role.visibility === 'private'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    {role.visibility === 'private' && '✓ '}
                    Private
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRole(e, role);
                    }}
                    className="flex-1 px-2 py-2 text-xs rounded border-2 border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
              
              {role.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {role.description}
                </p>
              )}
              
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>By {role.creator_name}</span>
                <span>🔥 {role.usage_count} uses</span>
              </div>
              
              <div className="mt-3 flex gap-2 flex-wrap">
                {role.role_block.categories?.slice(0, 3).map((cat: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex-1 overflow-auto bg-background">
        <div className="container max-w-7xl mx-auto py-6 space-y-6">
          <div className="bg-card rounded-2xl shadow-xl p-8 border">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Select Interview Role</h1>
                <p className="text-muted-foreground">
                  Choose from saved roles or create a new one
                </p>
              </div>
              <Button onClick={() => router.push('/interview/start/create')}>
                + Create New Role
              </Button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search roles by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Tabs value={section} onValueChange={(v) => setSection(v as 'my' | 'public')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my">My Roles</TabsTrigger>
                <TabsTrigger value="public">Public Roles</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my" className="mt-6">
                {renderRolesList()}
              </TabsContent>
              
              <TabsContent value="public" className="mt-6">
                <Tabs value={publicTab} onValueChange={(v) => setPublicTab(v as 'popular' | 'recent')} className="mb-4">
                  <TabsList>
                    <TabsTrigger value="popular">Most Popular</TabsTrigger>
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                  </TabsList>
                </Tabs>
                {renderRolesList()}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
