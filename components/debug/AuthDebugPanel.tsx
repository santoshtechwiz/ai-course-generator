"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth, useSubscription } from "@/modules/auth"
import { RefreshCw, Database, ArrowLeftRight } from "lucide-react"

/**
 * Auth Debug Component - Shows the current state of all auth and subscription data
 * This helps identify inconsistencies and test the unified refresh mechanisms
 */
export function AuthDebugPanel() {
  const { data: session, status } = useSession()
  const auth = useAuth()
  const subscription = useSubscription()

  const handleRefreshUserData = async () => {
    try {
      await auth.refreshUserData()
      console.log('✅ User data refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error)
    }
  }

  const handleRefreshSubscription = async () => {
    try {
      await auth.refreshSubscription()
      console.log('✅ Subscription data refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh subscription:', error)
    }
  }

  const handleSyncWithBackend = async () => {
    try {
      await auth.syncWithBackend()
      console.log('✅ Synced with backend')
    } catch (error) {
      console.error('❌ Failed to sync with backend:', error)
    }
  }
  // Remove auto-sync on mount to prevent excessive API calls
  // useEffect(() => {
  //   auth.syncWithBackend().catch(console.error)
  // }, [])

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-orange-100 text-orange-800'
      case 'CANCELED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan?.toUpperCase()) {
      case 'FREE': return 'bg-blue-100 text-blue-800'
      case 'PREMIUM': return 'bg-purple-100 text-purple-800'
      case 'ULTIMATE': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Auth & Subscription Debug Panel
          </CardTitle>
          <CardDescription>
            Current state of authentication and subscription data from all sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshUserData}
              disabled={auth.isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh User
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshSubscription}
              disabled={subscription.isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Subscription
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncWithBackend}
              disabled={auth.isLoading || subscription.isLoading}            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Sync with Backend
            </Button>
          </div>

          {/* Session Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">NextAuth Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><strong>Status:</strong> <Badge variant="outline">{status}</Badge></div>
                <div><strong>User ID:</strong> {session?.user?.id || 'N/A'}</div>
                <div><strong>Email:</strong> {session?.user?.email || 'N/A'}</div>
                <div><strong>User Type:</strong> 
                  <Badge className={getPlanColor(session?.user?.userType || 'FREE')}>
                    {session?.user?.userType || 'N/A'}
                  </Badge>
                </div>
                <div><strong>Credits:</strong> {session?.user?.credits || 0}</div>
                <div><strong>Subscription Plan:</strong> 
                  <Badge className={getPlanColor(session?.user?.subscriptionPlan || 'FREE')}>
                    {session?.user?.subscriptionPlan || 'N/A'}
                  </Badge>
                </div>
                <div><strong>Subscription Status:</strong> 
                  <Badge className={getStatusColor(session?.user?.subscriptionStatus || 'INACTIVE')}>
                    {session?.user?.subscriptionStatus || 'N/A'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Auth Provider State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><strong>Is Authenticated:</strong> {auth.isAuthenticated ? '✅' : '❌'}</div>
                <div><strong>Is Loading:</strong> {auth.isLoading ? '🔄' : '✅'}</div>
                <div><strong>User ID:</strong> {auth.user?.id || 'N/A'}</div>
                <div><strong>User Type:</strong> 
                  <Badge className={getPlanColor(auth.user?.userType || 'FREE')}>
                    {auth.user?.userType || 'N/A'}
                  </Badge>
                </div>
                <div><strong>Credits:</strong> {auth.user?.credits || 0}</div>
                <div><strong>Subscription Plan:</strong> 
                  <Badge className={getPlanColor(auth.subscription?.plan || 'FREE')}>
                    {auth.subscription?.plan || 'N/A'}
                  </Badge>
                </div>
                <div><strong>Subscription Status:</strong> 
                  <Badge className={getStatusColor(auth.subscription?.status || 'INACTIVE')}>
                    {auth.subscription?.status || 'N/A'}
                  </Badge>
                </div>
                <div><strong>Is Active:</strong> {auth.subscription?.isActive ? '✅' : '❌'}</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Subscription Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Enhanced Subscription Hook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div><strong>Plan:</strong> 
                    <Badge className={getPlanColor(subscription.subscription?.plan || 'FREE')}>
                      {subscription.subscription?.plan || 'N/A'}
                    </Badge>
                  </div>
                  <div><strong>Status:</strong> 
                    <Badge className={getStatusColor(subscription.subscription?.status || 'INACTIVE')}>
                      {subscription.subscription?.status || 'N/A'}
                    </Badge>
                  </div>
                  <div><strong>Is Active:</strong> {subscription.subscription?.isActive ? '✅' : '❌'}</div>
                  <div><strong>Is Subscribed:</strong> {subscription.subscription?.isSubscribed ? '✅' : '❌'}</div>
                </div>
                <div>
                  <div><strong>Credits:</strong> {subscription.subscription?.credits || 0}</div>
                  <div><strong>Tokens Used:</strong> {subscription.subscription?.tokensUsed || 0}</div>
                  <div><strong>Cancel at Period End:</strong> {subscription.subscription?.cancelAtPeriodEnd ? '✅' : '❌'}</div>
                  <div><strong>Current Period End:</strong> {subscription.subscription?.currentPeriodEnd || 'N/A'}</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div><strong>Is Loading:</strong> {subscription.isLoading ? '🔄' : '✅'}</div>
                <div><strong>Error:</strong> {subscription.error || 'None'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Data Consistency Check */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Consistency Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(() => {
                const sessionUserType = session?.user?.userType
                const authUserType = auth.user?.userType
                const sessionPlan = session?.user?.subscriptionPlan
                const authPlan = auth.subscription?.plan
                const subscriptionPlan = subscription.subscription?.plan

                const issues = []
                
                if (sessionUserType !== authUserType) {
                  issues.push(`Session userType (${sessionUserType}) != Auth userType (${authUserType})`)
                }
                
                if (sessionPlan !== authPlan) {
                  issues.push(`Session plan (${sessionPlan}) != Auth plan (${authPlan})`)
                }
                
                if (authPlan !== subscriptionPlan) {
                  issues.push(`Auth plan (${authPlan}) != Subscription plan (${subscriptionPlan})`)
                }

                if (issues.length === 0) {
                  return <div className="text-green-600">✅ All data sources are consistent</div>
                } else {
                  return (
                    <div className="text-red-600">
                      <div>❌ Data inconsistencies detected:</div>
                      <ul className="list-disc list-inside mt-2">
                        {issues.map((issue, i) => <li key={i}>{issue}</li>)}
                      </ul>
                    </div>
                  )
                }
              })()}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
