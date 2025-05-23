
import { useState, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortfolioItem } from "@/types/profile";
import { Json } from "@/integrations/supabase/types";

export function ProfileSettings() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const user = useUser();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        toast.error("Failed to load profile");
        return;
      }

      setName(profileData?.username || "");
      setBio(profileData?.bio || "");
      setImageUrl(profileData?.avatar_url || "");

      // Load portfolio items from the profile JSON field
      if (profileData?.portfolio_items) {
        // Cast the Json[] to PortfolioItem[] with proper type checking
        const portfolioData = profileData.portfolio_items as Json[];
        const typedPortfolioItems: PortfolioItem[] = portfolioData.map(item => {
          // Ensure each item has the required properties of PortfolioItem
          if (typeof item === 'object' && item !== null) {
            return {
              id: (item as any).id?.toString() || Math.random().toString(),
              title: (item as any).title?.toString() || "",
              description: (item as any).description?.toString() || "",
              url: (item as any).url?.toString() || "",
              imageUrl: (item as any).imageUrl?.toString() || ""
            };
          }
          // Fallback for invalid items
          return {
            id: Math.random().toString(),
            title: "",
            description: ""
          };
        });
        setPortfolioItems(typedPortfolioItems);
      }
    };

    fetchProfile();
  }, [user]);

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ username: e.target.value })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update name");
      return;
    }

    toast.success("Name updated successfully");
  };

  const handleBioChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value);
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ bio: e.target.value })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update bio");
      return;
    }

    toast.success("Bio updated successfully");
  };

  const handleImageUrlChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setImageUrl(e.target.value);
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: e.target.value })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update image URL");
      return;
    }

    toast.success("Image URL updated successfully");
  };

  const handlePortfolioItemsChange = async (items: PortfolioItem[]) => {
    if (!user) return;
    
    // Convert PortfolioItem[] to Json[] for database storage
    const jsonItems = items.map(item => {
      // Create a plain object from the PortfolioItem
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        url: item.url || "",
        imageUrl: item.imageUrl || ""
      };
    }) as unknown as Json[];
    
    const { error } = await supabase
      .from("profiles")
      .update({ portfolio_items: jsonItems })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update portfolio items");
      return;
    }

    setPortfolioItems(items);
    toast.success("Portfolio items updated successfully");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={imageUrl} alt={name} />
          <AvatarFallback>{name?.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="image-url">Image URL</Label>
          <Input
            id="image-url"
            type="text"
            value={imageUrl}
            onChange={handleImageUrlChange}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" type="text" value={name} onChange={handleNameChange} />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          value={bio}
          onChange={handleBioChange}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div>
        <Label>Portfolio Items</Label>
        {portfolioItems.map((item, index) => (
          <div key={item.id} className="flex flex-col gap-2">
            <Label htmlFor={`portfolio-title-${index}`}>Title</Label>
            <Input
              id={`portfolio-title-${index}`}
              type="text"
              value={item.title}
              onChange={(e) => {
                const newItems = [...portfolioItems];
                newItems[index].title = e.target.value;
                handlePortfolioItemsChange(newItems);
              }}
            />
            <Label htmlFor={`portfolio-description-${index}`}>Description</Label>
            <Input
              id={`portfolio-description-${index}`}
              type="text"
              value={item.description}
              onChange={(e) => {
                const newItems = [...portfolioItems];
                newItems[index].description = e.target.value;
                handlePortfolioItemsChange(newItems);
              }}
            />
            <Label htmlFor={`portfolio-url-${index}`}>URL</Label>
            <Input
              id={`portfolio-url-${index}`}
              type="text"
              value={item.url || ""}
              onChange={(e) => {
                const newItems = [...portfolioItems];
                newItems[index].url = e.target.value;
                handlePortfolioItemsChange(newItems);
              }}
            />
            <Label htmlFor={`portfolio-image-url-${index}`}>Image URL</Label>
            <Input
              id={`portfolio-image-url-${index}`}
              type="text"
              value={item.imageUrl || ""}
              onChange={(e) => {
                const newItems = [...portfolioItems];
                newItems[index].imageUrl = e.target.value;
                handlePortfolioItemsChange(newItems);
              }}
            />
          </div>
        ))}
        <Button
          onClick={() => {
            const newItem: PortfolioItem = {
              id: Math.random().toString(),
              title: "",
              description: "",
              url: "",
              imageUrl: "",
            };
            handlePortfolioItemsChange([...portfolioItems, newItem]);
          }}
        >
          Add Portfolio Item
        </Button>
      </div>
    </div>
  );
}
