'use client'

import { useState, useEffect } from 'react'
import { useSession, SessionProvider } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AdminOverview {
  stats: {
    totalUsers: number
    totalQuestions: number
    totalComments: number
    totalVotes: number
    totalTags: number
    unreadNotifications: number
  }
  growth: {
    users: {
      total: number
      recent: number
      percentage: string
    }
    questions: {
      total: number
      recent: number
      percentage: string
    }
    comments: {
      total: number
      recent: number
      percentage: string
    }
  }
  topTags: Array<{
    id: string
    name: string
    questionCount: number
  }>
  userRoleDistribution: Array<{
    role: string
    count: number
  }>
  topQuestions: Array<{
    questionId: string
    totalVotes: number
    voteCount: number
  }>
  mostActiveUsers: Array<{
    id: string
    name: string
    email: string
    image: string
    role: string
    questionCount: number
    commentCount: number
    voteCount: number
    totalActivity: number
  }>
}

function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Check authentication and admin status
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // You might want to add a role check here if needed
    fetchOverview()
  }, [session, status, router])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/overview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setError('Unauthorized. Admin access required.')
          return
        }
        throw new Error('Failed to fetch admin overview')
      }

      const data = await response.json()
      setOverview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminAction = async (action: string, data?: any) => {
    try {
      setActionLoading(action)
      setError(null)

      const response = await fetch('/api/admin/overview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      })

      if (!response.ok) {
        throw new Error('Failed to perform admin action')
      }

      const result = await response.json()
      alert(result.message || 'Action completed successfully')
      
      // Refresh overview data
      await fetchOverview()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No data available</h2>
          <button
            onClick={fetchOverview}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your application and monitor key metrics</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'users', name: 'Users' },
              { id: 'content', name: 'Content' },
              { id: 'actions', name: 'Actions' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">{overview.stats.totalUsers}</p>
              <p className="text-sm text-gray-600">+{overview.growth.users.percentage}% this month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900">Total Questions</h3>
              <p className="text-3xl font-bold text-green-600">{overview.stats.totalQuestions}</p>
              <p className="text-sm text-gray-600">+{overview.growth.questions.percentage}% this month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900">Total Comments</h3>
              <p className="text-3xl font-bold text-purple-600">{overview.stats.totalComments}</p>
              <p className="text-sm text-gray-600">+{overview.growth.comments.percentage}% this month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900">Total Votes</h3>
              <p className="text-3xl font-bold text-orange-600">{overview.stats.totalVotes}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900">Total Tags</h3>
              <p className="text-3xl font-bold text-teal-600">{overview.stats.totalTags}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900">Unread Notifications</h3>
              <p className="text-3xl font-bold text-red-600">{overview.stats.unreadNotifications}</p>
            </div>
          </div>

          {/* Top Tags */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.topTags.map((tag) => (
                <div key={tag.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{tag.name}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {tag.questionCount} questions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Role Distribution */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overview.userRoleDistribution.map((role) => (
                <div key={role.role} className="text-center p-4 bg-gray-50 rounded">
                  <p className="text-2xl font-bold text-gray-900">{role.count}</p>
                  <p className="text-sm text-gray-600 uppercase">{role.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Most Active Users */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Users</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Activity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overview.mostActiveUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={user.image || '/default-avatar.png'} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.questionCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.commentCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.voteCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.totalActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Top Questions by Votes */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Questions by Votes</h3>
            <div className="space-y-3">
              {overview.topQuestions.map((question, index) => (
                <div key={question.questionId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-3">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-600">Question ID: {question.questionId}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{question.voteCount} votes</span>
                    <span className="text-sm font-medium text-gray-900">Score: {question.totalVotes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleAdminAction('CLEAR_NOTIFICATIONS')}
                disabled={actionLoading === 'CLEAR_NOTIFICATIONS'}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <h4 className="font-medium text-blue-900">Clear Old Notifications</h4>
                <p className="text-sm text-blue-700 mt-1">Remove read notifications older than 30 days</p>
                {actionLoading === 'CLEAR_NOTIFICATIONS' && (
                  <div className="mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-blue-600">Processing...</span>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleAdminAction('DELETE_INACTIVE_USERS')}
                disabled={actionLoading === 'DELETE_INACTIVE_USERS'}
                className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <h4 className="font-medium text-red-900">Delete Inactive Users</h4>
                <p className="text-sm text-red-700 mt-1">Remove users with no activity (30+ days old)</p>
                {actionLoading === 'DELETE_INACTIVE_USERS' && (
                  <div className="mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    <span className="ml-2 text-sm text-red-600">Processing...</span>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleAdminAction('GENERATE_SYSTEM_REPORT')}
                disabled={actionLoading === 'GENERATE_SYSTEM_REPORT'}
                className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                <h4 className="font-medium text-green-900">Generate System Report</h4>
                <p className="text-sm text-green-700 mt-1">Create comprehensive system health report</p>
                {actionLoading === 'GENERATE_SYSTEM_REPORT' && (
                  <div className="mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-sm text-green-600">Processing...</span>
                  </div>
                )}
              </button>

              <button
                onClick={fetchOverview}
                disabled={loading}
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <h4 className="font-medium text-gray-900">Refresh Data</h4>
                <p className="text-sm text-gray-700 mt-1">Reload all dashboard data</p>
                {loading && (
                  <div className="mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading...</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap the component with SessionProvider
export default function AdminDashboardPage() {
  return (
    <SessionProvider>
      <AdminDashboard />
    </SessionProvider>
  )
}
