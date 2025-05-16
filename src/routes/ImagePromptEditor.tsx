import { createSignal, Show, onMount, For } from "solid-js";
import { useMutation } from "@tanstack/solid-query";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

// Assuming solid-ui components are installed and available at these paths
// You will need to ensure these paths are correct or install the components using solidui-cli
// e.g., npx solidui-cli@latest add button card alert text-field
import { Button } from "~/components/ui/button";
import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { type ImageHistoryItem } from "~/components/EditHistory";
import { Icon } from "~/components/ui/icon";

// Simple SVG Spinner
const SpinnerIcon = () => (
  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface ApiErrorResponse {
  error?: string;
  message?: string; 
  textResponse?: string; 
}

interface ApiSuccessResponse {
  editedImageDataB64?: string;
  mimeType?: string;
  textResponse?: string;
}

const editImageWithPrompt = async (payload: {
  imageDataB64: string;
  mimeType: string;
  prompt: string;
}): Promise<ApiSuccessResponse> => {
  const response = await fetch( import.meta.env.PROD
    ? "https://gemini-image-edit.jhonra121.workers.dev/api/edit-image-with-prompt"
    : "http://127.0.0.1:8787/api/edit-image-with-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse = { error: `HTTP error! status: ${response.status}` };
    try {
      errorData = await response.json();
    } catch (e) { }
    throw new Error(errorData.error || errorData.message || errorData.textResponse || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export function ImagePromptEditor() {
  const [prompt, setPrompt] = createSignal("");
  const [imagePreview, setImagePreview] = createSignal<string | null>(null);
  const [mimeType, setMimeType] = createSignal<string | null>(null);
  const [currentImageAssociatedPrompt, setCurrentImageAssociatedPrompt] = createSignal<string | null>(null);
  const [currentImageAIResponse, setCurrentImageAIResponse] = createSignal<string | null>(null);
  const [imageHistory, setImageHistory] = createSignal<ImageHistoryItem[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = createSignal(false);

  const addCurrentToBaseImageToHistory = () => {
    if (imagePreview() && mimeType()) {
      const base64Data = imagePreview()!.split(",")[1];
      const historyItem: ImageHistoryItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
        imageDataB64: base64Data,
        mimeType: mimeType()!,
        prompt: currentImageAssociatedPrompt() || undefined,
        textResponse: currentImageAIResponse() || undefined,
      };
      setImageHistory(prev => [historyItem, ...prev]);
    }
  };

  const mutation = useMutation<ApiSuccessResponse, Error, { imageDataB64: string; mimeType: string; prompt: string; }>(() => ({
    mutationFn: editImageWithPrompt,
    onSuccess: (data, variables) => {
      if (data.editedImageDataB64 && data.mimeType) {
        addCurrentToBaseImageToHistory();

        setImagePreview(`data:${data.mimeType};base64,${data.editedImageDataB64}`);
        setMimeType(data.mimeType);
        setCurrentImageAssociatedPrompt(variables.prompt);
        setCurrentImageAIResponse(data.textResponse || null);
        setPrompt("");
      }
    },
    onError: (error) => {
     console.error("Mutation failed:", error);
    }
  }));

  const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (imagePreview()) {
          addCurrentToBaseImageToHistory();
        }

        setImagePreview(result);
        setMimeType(file.type);
        setCurrentImageAssociatedPrompt("Initial Upload");
        setCurrentImageAIResponse(null);
        mutation.reset();
        setPrompt("");
      };
      reader.readAsDataURL(file);
    }
    input.value = "";
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (!imagePreview() || !mimeType() || !prompt()) {
      alert("Please select an image and enter a prompt.");
      return;
    }
    const base64Data = imagePreview()!.split(",")[1];
    if (!base64Data) {
        alert("Could not process image data.");
        return;
    }
    mutation.mutate({ imageDataB64: base64Data, mimeType: mimeType()!, prompt: prompt() });
  };

  const handleSelectHistoryItem = (selectedItem: ImageHistoryItem) => {
    const currentPreviewBase64 = imagePreview()?.split(",")[1];
    if (currentPreviewBase64 && currentPreviewBase64 !== selectedItem.imageDataB64) {
      addCurrentToBaseImageToHistory();
    }

    setImagePreview(`data:${selectedItem.mimeType};base64,${selectedItem.imageDataB64}`);
    setMimeType(selectedItem.mimeType);
    setCurrentImageAssociatedPrompt(selectedItem.prompt || "Restored from history");
    setCurrentImageAIResponse(selectedItem.textResponse || null);
    
    setImageHistory(prev => prev.filter(item => item.id !== selectedItem.id));

    setPrompt(selectedItem.prompt || "");
    mutation.reset(); 
  };
  
  const [animationClassEditor, setAnimationClassEditor] = createSignal("route-enter-initial");
  onMount(() => {
    setTimeout(() => {
      setAnimationClassEditor("route-enter-active");
    }, 10);
  });

  return (
    <div class={`p-6 space-y-6 rounded-lg shadow-xl bg-white ${animationClassEditor()}`}>
      <h2 class="text-3xl font-bold text-gray-800 mb-6">Image Editor with AI</h2>
      <form onSubmit={handleSubmit} class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Image & Enter Prompt</CardTitle>
            <CardDescription>{currentImageAssociatedPrompt() || "Select an image and provide a prompt."}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class={`transition-opacity duration-300 ${mutation.isPending ? "opacity-60" : "opacity-100"}`}>
              <label for="image-upload" class="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <input
                id="image-upload"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                class="block cursor-pointer w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:pointer-events-none"
                disabled={mutation.isPending}
              />
            </div>
            <Show when={imagePreview()}>
              <div class="mt-4 block w-full">
                <h4 class="text-md font-semibold text-gray-700 mb-2 block">Current Base Image:</h4>
                <div class={`relative w-full sm:max-w-sm transition-opacity duration-300 ${mutation.isPending ? "opacity-60" : "opacity-100"}`}>
                  <img
                    src={imagePreview()!}
                    alt="Current base image"
                    class={`block w-full max-h-72 rounded-md border border-gray-200 shadow-sm object-contain`}
                  />
                  <button
                    type="button"
                    class="absolute top-2 right-2 z-10 p-2 bg-gray-700 bg-opacity-60 text-white rounded-full focus:opacity-100 transition-opacity duration-150 hover:bg-opacity-80 flex items-center justify-center"
                    aria-label="View Edit History"
                    onClick={() => setIsHistoryDialogOpen(true)}
                  >
                    <Icon name="history" class="w-5 h-5" />
                  </button>
                </div>
                <Show when={currentImageAIResponse() && currentImageAssociatedPrompt() !== 'Initial Upload'}>
                    <p class="text-xs text-gray-600 mt-1 italic max-w-xs sm:max-w-sm">AI's take: {currentImageAIResponse()}</p>
                </Show>
              </div>
            </Show>
            <TextField 
              value={prompt()} 
              onChange={(newValue: string) => setPrompt(newValue)} 
              disabled={mutation.isPending}
              class={`transition-opacity duration-300 ${mutation.isPending ? "opacity-60" : "opacity-100"}`}
            >
              <TextFieldLabel class="text-sm font-medium text-gray-700">Prompt for Next Edit</TextFieldLabel>
              <TextFieldInput id="prompt-input" placeholder="e.g., Make the cat wear a party hat" class="mt-1 text-base" />
            </TextField>
            <Button 
              type="submit" 
              disabled={mutation.isPending || !imagePreview() || !prompt()} 
              class={`w-full cursor-pointer sm:w-auto transition-all duration-150 ease-in-out hover:scale-105 active:scale-95 flex items-center justify-center ${mutation.isPending ? "opacity-60" : "opacity-100"}`}
            >
              <Show when={mutation.isPending} 
                fallback={<>Generate Image</>}
              >
                <SpinnerIcon />
                Generating...
              </Show>
            </Button>
          </CardContent>
        </Card>
      </form>

      <Show when={mutation.isError}>
        <Alert variant="destructive" class="mt-6 animate-[fadeInSlideUp_300ms_ease-out_forwards]">
          <AlertTitle>Error Generating Image</AlertTitle>
          <AlertDescription>{(mutation.error as Error)?.message || "An unknown error occurred while editing the image."}</AlertDescription>
        </Alert>
      </Show>

      <Dialog
        open={isHistoryDialogOpen()}
        onOpenChange={setIsHistoryDialogOpen}
        modal={true}
      >
        <DialogContent class="bg-white rounded-lg shadow-xl max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[80vh] flex flex-col p-0">
          <div class="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
            <DialogTitle class="text-xl font-semibold">Full Edit History</DialogTitle>
          </div>
          <div class="p-4 overflow-y-auto flex-grow">
            <Show when={imageHistory().length === 0}>
                <p class="text-gray-500 text-center py-8">No past edits found.</p>
            </Show>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <For each={imageHistory()}> 
                {(item) => (
                  <button
                    onClick={() => {
                      handleSelectHistoryItem(item);
                      setIsHistoryDialogOpen(false);
                    }}
                    class="flex-shrink-0 w-full aspect-square rounded-md overflow-hidden border-2 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150 ease-in-out bg-gray-50 p-0.5 block relative group"
                    aria-label={`Revert to image from prompt: ${item.prompt || 'Initial image'}`}
                  >
                    <img
                      src={`data:${item.mimeType};base64,${item.imageDataB64}`}
                      alt={item.prompt || "History image"}
                      class="w-full h-full object-cover rounded-sm"
                    />
                    <Show when={item.prompt || item.textResponse}>
                      <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-1 text-[10px] leading-tight truncate opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        {item.prompt || item.textResponse}
                      </div>
                    </Show>
                  </button>
                )}
              </For>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 