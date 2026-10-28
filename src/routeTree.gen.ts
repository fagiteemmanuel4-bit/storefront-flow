/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// Generated route tree snapshot. Settings routes are explicitly registered here so
// deployments that reuse the committed route tree cannot omit the Settings subtree.

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthenticatedRouteRouteImport } from './routes/_authenticated/route'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as PrivacyRouteImport } from './routes/privacy'
import { Route as SupportRouteImport } from './routes/support'
import { Route as TermsRouteImport } from './routes/terms'
import { Route as AuthenticatedDashboardRouteImport } from './routes/_authenticated/dashboard'
import { Route as AuthenticatedExpensesRouteImport } from './routes/_authenticated/expenses'
import { Route as AuthenticatedOnboardingRouteImport } from './routes/_authenticated/onboarding'
import { Route as AuthenticatedPosRouteImport } from './routes/_authenticated/pos'
import { Route as AuthenticatedProductsRouteImport } from './routes/_authenticated/products'
import { Route as AuthenticatedReportsRouteImport } from './routes/_authenticated/reports'
import { Route as AuthenticatedAdvancedSettingsRouteImport } from './routes/_authenticated/advanced-settings'
import { Route as AuthenticatedSettingsRouteImport } from './routes/_authenticated/settings'
import { Route as AuthenticatedSettingsIndexRouteImport } from './routes/_authenticated/settings/index'
import { Route as AuthenticatedSettingsAdvancedRouteImport } from './routes/_authenticated/settings/advanced'
import { Route as AuthenticatedSettingsAppearanceRouteImport } from './routes/_authenticated/settings/appearance'
import { Route as AuthenticatedSettingsCheckoutRouteImport } from './routes/_authenticated/settings/checkout'
import { Route as AuthenticatedSettingsInventoryRouteImport } from './routes/_authenticated/settings/inventory'
import { Route as AuthenticatedSettingsNotificationsRouteImport } from './routes/_authenticated/settings/notifications'
import { Route as AuthenticatedSettingsOnlineStoreRouteImport } from './routes/_authenticated/settings/online-store'
import { Route as AuthenticatedSettingsPasswordRouteImport } from './routes/_authenticated/settings/password'
import { Route as AuthenticatedSettingsPaymentsRouteImport } from './routes/_authenticated/settings/payments'
import { Route as AuthenticatedSettingsReceiptsRouteImport } from './routes/_authenticated/settings/receipts'
import { Route as AuthenticatedSettingsSecurityRouteImport } from './routes/_authenticated/settings/security'
import { Route as AuthenticatedSettingsSessionsRouteImport } from './routes/_authenticated/settings/sessions'
import { Route as AuthenticatedSettingsSessionsRevokeRouteImport } from './routes/_authenticated/settings/sessions/revoke'
import { Route as AuthenticatedSettingsStaffRouteImport } from './routes/_authenticated/settings/staff'
import { Route as AuthenticatedSettingsStoreProfileRouteImport } from './routes/_authenticated/settings/store-profile'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const AuthenticatedRouteRoute = AuthenticatedRouteRouteImport.update({ id: '/_authenticated', getParentRoute: () => rootRouteImport } as any)
const AuthRoute = AuthRouteImport.update({ id: '/auth', path: '/auth', getParentRoute: () => rootRouteImport } as any)
const PrivacyRoute = PrivacyRouteImport.update({ id: '/privacy', path: '/privacy', getParentRoute: () => rootRouteImport } as any)
const SupportRoute = SupportRouteImport.update({ id: '/support', path: '/support', getParentRoute: () => rootRouteImport } as any)
const TermsRoute = TermsRouteImport.update({ id: '/terms', path: '/terms', getParentRoute: () => rootRouteImport } as any)
const AuthenticatedDashboardRoute = AuthenticatedDashboardRouteImport.update({ id: '/dashboard', path: '/dashboard', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedExpensesRoute = AuthenticatedExpensesRouteImport.update({ id: '/expenses', path: '/expenses', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedOnboardingRoute = AuthenticatedOnboardingRouteImport.update({ id: '/onboarding', path: '/onboarding', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedPosRoute = AuthenticatedPosRouteImport.update({ id: '/pos', path: '/pos', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedProductsRoute = AuthenticatedProductsRouteImport.update({ id: '/products', path: '/products', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedReportsRoute = AuthenticatedReportsRouteImport.update({ id: '/reports', path: '/reports', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedAdvancedSettingsRoute = AuthenticatedAdvancedSettingsRouteImport.update({ id: '/advanced-settings', path: '/advanced-settings', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedSettingsRoute = AuthenticatedSettingsRouteImport.update({ id: '/settings', path: '/settings', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedSettingsIndexRoute = AuthenticatedSettingsIndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsAdvancedRoute = AuthenticatedSettingsAdvancedRouteImport.update({ id: '/advanced', path: '/advanced', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsAppearanceRoute = AuthenticatedSettingsAppearanceRouteImport.update({ id: '/appearance', path: '/appearance', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsCheckoutRoute = AuthenticatedSettingsCheckoutRouteImport.update({ id: '/checkout', path: '/checkout', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsInventoryRoute = AuthenticatedSettingsInventoryRouteImport.update({ id: '/inventory', path: '/inventory', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsNotificationsRoute = AuthenticatedSettingsNotificationsRouteImport.update({ id: '/notifications', path: '/notifications', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsOnlineStoreRoute = AuthenticatedSettingsOnlineStoreRouteImport.update({ id: '/online-store', path: '/online-store', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsPasswordRoute = AuthenticatedSettingsPasswordRouteImport.update({ id: '/password', path: '/password', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsPaymentsRoute = AuthenticatedSettingsPaymentsRouteImport.update({ id: '/payments', path: '/payments', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsReceiptsRoute = AuthenticatedSettingsReceiptsRouteImport.update({ id: '/receipts', path: '/receipts', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsSecurityRoute = AuthenticatedSettingsSecurityRouteImport.update({ id: '/security', path: '/security', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsSessionsRoute = AuthenticatedSettingsSessionsRouteImport.update({ id: '/sessions', path: '/sessions', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsSessionsRevokeRoute = AuthenticatedSettingsSessionsRevokeRouteImport.update({ id: '/revoke', path: '/revoke', getParentRoute: () => AuthenticatedSettingsSessionsRoute } as any)
const AuthenticatedSettingsStaffRoute = AuthenticatedSettingsStaffRouteImport.update({ id: '/staff', path: '/staff', getParentRoute: () => AuthenticatedSettingsRoute } as any)
const AuthenticatedSettingsStoreProfileRoute = AuthenticatedSettingsStoreProfileRouteImport.update({ id: '/store-profile', path: '/store-profile', getParentRoute: () => AuthenticatedSettingsRoute } as any)

interface AuthenticatedSettingsRouteChildren {
  AuthenticatedSettingsIndexRoute: typeof AuthenticatedSettingsIndexRoute
  AuthenticatedSettingsAdvancedRoute: typeof AuthenticatedSettingsAdvancedRoute
  AuthenticatedSettingsAppearanceRoute: typeof AuthenticatedSettingsAppearanceRoute
  AuthenticatedSettingsCheckoutRoute: typeof AuthenticatedSettingsCheckoutRoute
  AuthenticatedSettingsInventoryRoute: typeof AuthenticatedSettingsInventoryRoute
  AuthenticatedSettingsNotificationsRoute: typeof AuthenticatedSettingsNotificationsRoute
  AuthenticatedSettingsOnlineStoreRoute: typeof AuthenticatedSettingsOnlineStoreRoute
  AuthenticatedSettingsPasswordRoute: typeof AuthenticatedSettingsPasswordRoute
  AuthenticatedSettingsPaymentsRoute: typeof AuthenticatedSettingsPaymentsRoute
  AuthenticatedSettingsReceiptsRoute: typeof AuthenticatedSettingsReceiptsRoute
  AuthenticatedSettingsSecurityRoute: typeof AuthenticatedSettingsSecurityRoute
  AuthenticatedSettingsSessionsRoute: typeof AuthenticatedSettingsSessionsRouteWithChildren
  AuthenticatedSettingsStaffRoute: typeof AuthenticatedSettingsStaffRoute
  AuthenticatedSettingsStoreProfileRoute: typeof AuthenticatedSettingsStoreProfileRoute
}

interface AuthenticatedSettingsSessionsRouteChildren {
  AuthenticatedSettingsSessionsRevokeRoute: typeof AuthenticatedSettingsSessionsRevokeRoute
}

const AuthenticatedSettingsSessionsRouteChildren: AuthenticatedSettingsSessionsRouteChildren = {
  AuthenticatedSettingsSessionsRevokeRoute: AuthenticatedSettingsSessionsRevokeRoute,
}
const AuthenticatedSettingsSessionsRouteWithChildren = AuthenticatedSettingsSessionsRoute._addFileChildren(AuthenticatedSettingsSessionsRouteChildren)
const AuthenticatedSettingsRouteChildren: AuthenticatedSettingsRouteChildren = {
  AuthenticatedSettingsIndexRoute,
  AuthenticatedSettingsAdvancedRoute,
  AuthenticatedSettingsAppearanceRoute,
  AuthenticatedSettingsCheckoutRoute,
  AuthenticatedSettingsInventoryRoute,
  AuthenticatedSettingsNotificationsRoute,
  AuthenticatedSettingsOnlineStoreRoute,
  AuthenticatedSettingsPasswordRoute,
  AuthenticatedSettingsPaymentsRoute,
  AuthenticatedSettingsReceiptsRoute,
  AuthenticatedSettingsSecurityRoute,
  AuthenticatedSettingsSessionsRoute: AuthenticatedSettingsSessionsRouteWithChildren,
  AuthenticatedSettingsStaffRoute,
  AuthenticatedSettingsStoreProfileRoute,
}
const AuthenticatedSettingsRouteWithChildren = AuthenticatedSettingsRoute._addFileChildren(AuthenticatedSettingsRouteChildren)

interface AuthenticatedRouteRouteChildren {
  AuthenticatedDashboardRoute: typeof AuthenticatedDashboardRoute
  AuthenticatedExpensesRoute: typeof AuthenticatedExpensesRoute
  AuthenticatedOnboardingRoute: typeof AuthenticatedOnboardingRoute
  AuthenticatedPosRoute: typeof AuthenticatedPosRoute
  AuthenticatedProductsRoute: typeof AuthenticatedProductsRoute
  AuthenticatedReportsRoute: typeof AuthenticatedReportsRoute
  AuthenticatedAdvancedSettingsRoute: typeof AuthenticatedAdvancedSettingsRoute
  AuthenticatedSettingsRoute: typeof AuthenticatedSettingsRouteWithChildren
}
const AuthenticatedRouteRouteChildren: AuthenticatedRouteRouteChildren = {
  AuthenticatedDashboardRoute,
  AuthenticatedExpensesRoute,
  AuthenticatedOnboardingRoute,
  AuthenticatedPosRoute,
  AuthenticatedProductsRoute,
  AuthenticatedReportsRoute,
  AuthenticatedAdvancedSettingsRoute,
  AuthenticatedSettingsRoute: AuthenticatedSettingsRouteWithChildren,
}
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/auth': typeof AuthRoute
  '/privacy': typeof PrivacyRoute
  '/support': typeof SupportRoute
  '/terms': typeof TermsRoute
  '/dashboard': typeof AuthenticatedDashboardRoute
  '/expenses': typeof AuthenticatedExpensesRoute
  '/onboarding': typeof AuthenticatedOnboardingRoute
  '/pos': typeof AuthenticatedPosRoute
  '/products': typeof AuthenticatedProductsRoute
  '/reports': typeof AuthenticatedReportsRoute
  '/advanced-settings': typeof AuthenticatedAdvancedSettingsRoute
  '/settings': typeof AuthenticatedSettingsIndexRoute
  '/settings/advanced': typeof AuthenticatedSettingsAdvancedRoute
  '/settings/appearance': typeof AuthenticatedSettingsAppearanceRoute
  '/settings/checkout': typeof AuthenticatedSettingsCheckoutRoute
  '/settings/inventory': typeof AuthenticatedSettingsInventoryRoute
  '/settings/notifications': typeof AuthenticatedSettingsNotificationsRoute
  '/settings/online-store': typeof AuthenticatedSettingsOnlineStoreRoute
  '/settings/password': typeof AuthenticatedSettingsPasswordRoute
  '/settings/payments': typeof AuthenticatedSettingsPaymentsRoute
  '/settings/receipts': typeof AuthenticatedSettingsReceiptsRoute
  '/settings/security': typeof AuthenticatedSettingsSecurityRoute
  '/settings/sessions': typeof AuthenticatedSettingsSessionsRouteWithChildren
  '/settings/sessions/revoke': typeof AuthenticatedSettingsSessionsRevokeRoute
  '/settings/staff': typeof AuthenticatedSettingsStaffRoute
  '/settings/store-profile': typeof AuthenticatedSettingsStoreProfileRoute
}
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/_authenticated': typeof AuthenticatedRouteRouteWithChildren
  '/auth': typeof AuthRoute
  '/privacy': typeof PrivacyRoute
  '/support': typeof SupportRoute
  '/terms': typeof TermsRoute
  '/_authenticated/dashboard': typeof AuthenticatedDashboardRoute
  '/_authenticated/expenses': typeof AuthenticatedExpensesRoute
  '/_authenticated/onboarding': typeof AuthenticatedOnboardingRoute
  '/_authenticated/pos': typeof AuthenticatedPosRoute
  '/_authenticated/products': typeof AuthenticatedProductsRoute
  '/_authenticated/reports': typeof AuthenticatedReportsRoute
  '/_authenticated/advanced-settings': typeof AuthenticatedAdvancedSettingsRoute
  '/_authenticated/settings': typeof AuthenticatedSettingsRouteWithChildren
  '/_authenticated/settings/advanced': typeof AuthenticatedSettingsAdvancedRoute
  '/_authenticated/settings/appearance': typeof AuthenticatedSettingsAppearanceRoute
  '/_authenticated/settings/checkout': typeof AuthenticatedSettingsCheckoutRoute
  '/_authenticated/settings/inventory': typeof AuthenticatedSettingsInventoryRoute
  '/_authenticated/settings/notifications': typeof AuthenticatedSettingsNotificationsRoute
  '/_authenticated/settings/online-store': typeof AuthenticatedSettingsOnlineStoreRoute
  '/_authenticated/settings/password': typeof AuthenticatedSettingsPasswordRoute
  '/_authenticated/settings/payments': typeof AuthenticatedSettingsPaymentsRoute
  '/_authenticated/settings/receipts': typeof AuthenticatedSettingsReceiptsRoute
  '/_authenticated/settings/security': typeof AuthenticatedSettingsSecurityRoute
  '/_authenticated/settings/sessions': typeof AuthenticatedSettingsSessionsRouteWithChildren
  '/_authenticated/settings/sessions/revoke': typeof AuthenticatedSettingsSessionsRevokeRoute
  '/_authenticated/settings/staff': typeof AuthenticatedSettingsStaffRoute
  '/_authenticated/settings/store-profile': typeof AuthenticatedSettingsStoreProfileRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: keyof FileRoutesByFullPath
  fileRoutesByTo: FileRoutesByTo
  to: keyof FileRoutesByTo
  id: keyof FileRoutesById
  fileRoutesById: FileRoutesById
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_authenticated/settings': { id: '/_authenticated/settings'; path: '/settings'; fullPath: '/settings'; preLoaderRoute: typeof AuthenticatedSettingsRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/settings/': { id: '/_authenticated/settings/'; path: '/'; fullPath: '/settings/'; preLoaderRoute: typeof AuthenticatedSettingsIndexRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/advanced': { id: '/_authenticated/settings/advanced'; path: '/advanced'; fullPath: '/settings/advanced'; preLoaderRoute: typeof AuthenticatedSettingsAdvancedRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/appearance': { id: '/_authenticated/settings/appearance'; path: '/appearance'; fullPath: '/settings/appearance'; preLoaderRoute: typeof AuthenticatedSettingsAppearanceRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/checkout': { id: '/_authenticated/settings/checkout'; path: '/checkout'; fullPath: '/settings/checkout'; preLoaderRoute: typeof AuthenticatedSettingsCheckoutRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/inventory': { id: '/_authenticated/settings/inventory'; path: '/inventory'; fullPath: '/settings/inventory'; preLoaderRoute: typeof AuthenticatedSettingsInventoryRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/notifications': { id: '/_authenticated/settings/notifications'; path: '/notifications'; fullPath: '/settings/notifications'; preLoaderRoute: typeof AuthenticatedSettingsNotificationsRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/online-store': { id: '/_authenticated/settings/online-store'; path: '/online-store'; fullPath: '/settings/online-store'; preLoaderRoute: typeof AuthenticatedSettingsOnlineStoreRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/password': { id: '/_authenticated/settings/password'; path: '/password'; fullPath: '/settings/password'; preLoaderRoute: typeof AuthenticatedSettingsPasswordRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/payments': { id: '/_authenticated/settings/payments'; path: '/payments'; fullPath: '/settings/payments'; preLoaderRoute: typeof AuthenticatedSettingsPaymentsRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/receipts': { id: '/_authenticated/settings/receipts'; path: '/receipts'; fullPath: '/settings/receipts'; preLoaderRoute: typeof AuthenticatedSettingsReceiptsRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/security': { id: '/_authenticated/settings/security'; path: '/security'; fullPath: '/settings/security'; preLoaderRoute: typeof AuthenticatedSettingsSecurityRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/sessions': { id: '/_authenticated/settings/sessions'; path: '/sessions'; fullPath: '/settings/sessions'; preLoaderRoute: typeof AuthenticatedSettingsSessionsRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/sessions/revoke': { id: '/_authenticated/settings/sessions/revoke'; path: '/revoke'; fullPath: '/settings/sessions/revoke'; preLoaderRoute: typeof AuthenticatedSettingsSessionsRevokeRouteImport; parentRoute: typeof AuthenticatedSettingsSessionsRoute }
    '/_authenticated/settings/staff': { id: '/_authenticated/settings/staff'; path: '/staff'; fullPath: '/settings/staff'; preLoaderRoute: typeof AuthenticatedSettingsStaffRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
    '/_authenticated/settings/store-profile': { id: '/_authenticated/settings/store-profile'; path: '/store-profile'; fullPath: '/settings/store-profile'; preLoaderRoute: typeof AuthenticatedSettingsStoreProfileRouteImport; parentRoute: typeof AuthenticatedSettingsRoute }
  }
}

const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute,
  PrivacyRoute,
  SupportRoute,
  TermsRoute,
}

export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
