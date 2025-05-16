import { Show, createSignal, onMount, For, createMemo, Suspense } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { Transition } from "solid-transition-group";

// Shopify Storefront API client
import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Define types for Shopify data
type ShopifyProductImage = {
  node: {
    url: string;
    altText: string | null;
  }
};

type ShopifyProductPrice = {
  amount: string;
  currencyCode: string;
};

type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  priceRange: {
    minVariantPrice: ShopifyProductPrice;
  };
  images: {
    edges: ShopifyProductImage[];
  };
};

type ShopifyProductEdge = {
  node: ShopifyProduct;
};

type ShopifyProductsData = {
  products: {
    edges: ShopifyProductEdge[];
  };
};

// Create the Shopify client using environment variables
const client = createStorefrontApiClient({
  storeDomain: import.meta.env.VITE_SHOPIFY_STORE_DOMAIN,
  apiVersion: '2023-10',
  publicAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_API,
});

// Query to fetch all products
const fetchAllProducts = async (): Promise<ShopifyProductsData> => {
  const allProductsQuery = `
    query GetAllProducts {
      products(first: 10) {
        edges {
          node {
            id
            title
            handle
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const { data, errors } = await client.request(allProductsQuery);

    if (errors) {
      throw new Error(JSON.stringify(errors));
    }

    return data as ShopifyProductsData;
  } catch (error) {
    throw error;
  }
};

// // Query to fetch a single product (kept for reference)
// const fetchSingleProduct = async (handle: string) => {
//   const productQuery = `
//     query ProductQuery($handle: String) {
//       product(handle: $handle) {
//         id
//         title
//         handle
//         description
//         priceRange {
//           minVariantPrice {
//             amount
//             currencyCode
//           }
//         }
//         images(first: 1) {
//           edges {
//             node {
//               url
//               altText
//             }
//           }
//         }
//       }
//     }
//   `;

//   try {
//     const { data, errors } = await client.request(productQuery, {
//       variables: {
//         handle: handle,
//       },
//     });

//     if (errors) {
//       throw new Error(JSON.stringify(errors));
//     }

//     return data;
//   } catch (error) {
//     throw error;
//   }
// };

// New component to handle content display after data is loaded
function ShopifyProductsContent(props: {
  searchQuery: () => string;
  onSearchQueryChange: (value: string) => void;
}) {
  // Use TanStack Query to fetch all products
  const productsQuery = useQuery<ShopifyProductsData>(() => ({
    queryKey: ["allProducts"],
    queryFn: fetchAllProducts,
    suspense: true, // Ensure suspense mode is enabled if not default
  }));

  // Filter products based on search query
  const filteredProducts = createMemo<ShopifyProductEdge[]>(() => {
    // productsQuery.data will be available here due to Suspense
    const data = productsQuery.data;
    if (!data?.products?.edges) {
      return [];
    }
    
    const query = props.searchQuery().toLowerCase().trim();
    if (!query) {
      return data.products.edges;
    }
    
    return data.products.edges.filter((edge: ShopifyProductEdge) => 
      edge.node.title.toLowerCase().includes(query)
    );
  });

  // Handle query error state
  if (productsQuery.isError) {
    return (
      <div class="mt-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
        <h4 class="font-semibold text-lg mb-2">Error:</h4>
        <p class="text-sm">{(productsQuery.error as Error)?.message || "An unknown error occurred"}</p>
      </div>
    );
  }
  
  // productsQuery.data is guaranteed to be available here by Suspense if no error
  const hasInitiallyLoadedProducts = () => (productsQuery.data?.products?.edges?.length ?? 0) > 0;

  return (
    <>
      <Show when={hasInitiallyLoadedProducts()}>
        <div class="relative mt-4"> {/* Added mt-4 for spacing, adjust as needed */}
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input 
            type="search" 
            class="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Search products..." 
            value={props.searchQuery()}
            onInput={(e) => props.onSearchQueryChange(e.currentTarget.value)}
          />
        </div>
      </Show>

      <Transition 
        onEnter={(el, done) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.opacity = "0";
          
          requestAnimationFrame(() => {
            const animation = htmlEl.animate([
              { opacity: 0, transform: 'translateY(-5px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ], {
              duration: 150,
              easing: 'ease-in-out',
              fill: 'forwards'
            });
            
            animation.onfinish = () => {
              htmlEl.style.opacity = "1";
              done();
            };
          });
        }}
        onExit={(el, done) => {
          const htmlEl = el as HTMLElement;
          
          const animation = htmlEl.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-5px)' }
          ], {
            duration: 150,
            easing: 'ease-in-out',
            fill: 'forwards'
          });
          
          animation.onfinish = () => {
            done();
          };
        }}
      >
        {/* The content of the transition: only show if there are products to display (either initially or after filtering) */}
        <Show when={hasInitiallyLoadedProducts() || (props.searchQuery() && filteredProducts().length > 0)}>
          <div class="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
            <h4 class="font-semibold text-lg text-gray-700 mb-4">Products from your store:</h4>
            
            <Show 
              when={filteredProducts().length > 0} 
              fallback={
                // This fallback is for when a search is active but yields no results.
                <Show when={props.searchQuery() && hasInitiallyLoadedProducts()}> 
                   <div class="col-span-full py-8 text-center">
                    <p class="text-gray-500">No products match your search. Try a different query.</p>
                  </div>
                </Show>
              }
            >
              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <For each={filteredProducts()}>
                    {(edge) => {
                      const product = edge.node;
                      return (
                        <div class="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
                          {product.images?.edges?.[0] ? (
                            <div class="aspect-square overflow-hidden bg-gray-100">
                              <img 
                                src={product.images.edges[0].node.url} 
                                alt={product.images.edges[0].node.altText || product.title} 
                                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div class="aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
                              <div class="text-gray-400">No image</div>
                            </div>
                          )}
                          
                          <div class="p-4">
                            <h3 class="text-lg font-semibold text-gray-800 truncate">{product.title}</h3>
                            
                            {product.priceRange?.minVariantPrice && (
                              <p class="text-md font-medium text-gray-700 mt-1">
                                {new Intl.NumberFormat('en-US', { 
                                  style: 'currency', 
                                  currency: product.priceRange.minVariantPrice.currencyCode 
                                }).format(parseFloat(product.priceRange.minVariantPrice.amount))}
                              </p>
                            )}
                            
                            {product.description && (
                              <p class="mt-2 text-sm text-gray-600 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            
                            <div class="mt-4 pt-3 border-t border-gray-100">
                              <button class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-150">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
                
                {/* Show raw JSON details only if there were initial products */}
                <Show when={hasInitiallyLoadedProducts()}>
                  <details class="text-xs">
                    <summary class="cursor-pointer text-blue-600 hover:text-blue-800">View Raw JSON Data</summary>
                    <pre class="mt-2 bg-slate-100 p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(productsQuery.data?.products || {}, null, 2)}
                    </pre>
                  </details>
                </Show>
              </div>
            </Show>
            
            {/* Fallback for when there are initially NO products from the store and no active search */}
            <Show when={!hasInitiallyLoadedProducts() && !props.searchQuery()}>
                <div class="py-8 text-center">
                    <p class="text-gray-500 italic">No products available in your store.</p>
                </div>
            </Show>
          </div>
        </Show>
      </Transition>
    </>
  );
}

export function ShopifyRoute() {
  const [animationClass, setAnimationClass] = createSignal("route-enter-initial");
  const [searchQuery, setSearchQuery] = createSignal("");

  onMount(() => {
    setTimeout(() => {
      setAnimationClass("route-enter-active");
    }, 10);
  });
  
  return (
    <div class={`p-4 space-y-4 rounded-lg shadow-md bg-white ${animationClass()}`}>
      <h3 class="text-2xl font-semibold text-gray-800">Shopify Products</h3>
      <p class="text-gray-600">Browsing products from your Shopify store</p>
      
      <Suspense fallback={
        <div class="flex items-center space-x-2 text-blue-600 py-4"> {/* Added py-4 for spacing */}
          <div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Loading products...</span>
        </div>
      }>
        <ShopifyProductsContent searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
      </Suspense>
    </div>
  );
} 