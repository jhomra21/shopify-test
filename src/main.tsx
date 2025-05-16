import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import { render } from 'solid-js/web'
import { For, children as resolveChildren } from 'solid-js'
import { Icon, type IconName } from './components/ui/icon'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

import './styles.css'

import App from './App.tsx'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from './components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip"

import { ShopifyRoute } from './routes/ShopifyRoute'

const navRoutes: { path: string; name: string; iconName: IconName }[] = [
  { path: '/', name: 'Home', iconName: 'house' },
  { path: '/shopify', name: 'Shopify', iconName: 'shoppingCart' },
];

function AppSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile()) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <For each={navRoutes}>
                {(route) => {
                  const linkChildren = resolveChildren(() => (
                    <div class="flex items-center gap-2">
                      <Icon name={route.iconName} class="h-5 w-5" />
                      <span>{route.name}</span>
                    </div>
                  ));

                  return (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        as={Link} 
                        to={route.path} 
                        preload="intent"
                        class="w-full text-left"
                        onClick={handleLinkClick}
                      >
                        {linkChildren()} 
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }}
              </For>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <SidebarProvider>
      <AppSidebar />
      <main class="flex flex-col flex-grow h-screen overflow-hidden p-2 transition-all duration-150 ease-in data-[sidebar-open=true]:md:ml-[var(--sidebar-width)] min-w-0">
        <div class="flex-shrink-0 p-1.5 border border-gray-200 backdrop-blur-sm rounded-lg">
          <Tooltip>
            <TooltipTrigger>
              <SidebarTrigger />
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div class="flex-grow overflow-y-auto py-4">
          <Outlet />
        </div>
        <TanStackRouterDevtools position="bottom-right" />
      </main>
    </SidebarProvider>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
})


const shopifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shopify',
  component: ShopifyRoute,
});

const routeTree = rootRoute.addChildren([indexRoute, shopifyRoute])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

// Create a new QueryClient instance
const queryClient = new QueryClient();

function MainApp() {
  return (
    // Wrap RouterProvider with QueryClientProvider
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('app')
if (rootElement) {
  render(() => <MainApp />, rootElement)
}
