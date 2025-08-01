/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './routes/__root'
import { Route as ChatRouteImport } from './routes/chat'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthRegisterRouteImport } from './routes/_auth/register'
import { Route as AuthLoginRouteImport } from './routes/_auth/login'

const ChatRoute = ChatRouteImport.update({
  id: '/chat',
  path: '/chat',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthRegisterRoute = AuthRegisterRouteImport.update({
  id: '/_auth/register',
  path: '/register',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthLoginRoute = AuthLoginRouteImport.update({
  id: '/_auth/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/chat': typeof ChatRoute
  '/login': typeof AuthLoginRoute
  '/register': typeof AuthRegisterRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/chat': typeof ChatRoute
  '/login': typeof AuthLoginRoute
  '/register': typeof AuthRegisterRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/chat': typeof ChatRoute
  '/_auth/login': typeof AuthLoginRoute
  '/_auth/register': typeof AuthRegisterRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/chat' | '/login' | '/register'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/chat' | '/login' | '/register'
  id: '__root__' | '/' | '/chat' | '/_auth/login' | '/_auth/register'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ChatRoute: typeof ChatRoute
  AuthLoginRoute: typeof AuthLoginRoute
  AuthRegisterRoute: typeof AuthRegisterRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/chat': {
      id: '/chat'
      path: '/chat'
      fullPath: '/chat'
      preLoaderRoute: typeof ChatRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_auth/register': {
      id: '/_auth/register'
      path: '/register'
      fullPath: '/register'
      preLoaderRoute: typeof AuthRegisterRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_auth/login': {
      id: '/_auth/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof AuthLoginRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ChatRoute: ChatRoute,
  AuthLoginRoute: AuthLoginRoute,
  AuthRegisterRoute: AuthRegisterRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
