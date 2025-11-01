import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { News } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Trophy, Newspaper, Search, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AdminNews() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<News | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "match-report" | "announcement" | "news">("all");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    author: "",
    date: "",
    readTime: "",
    image: "",
    competition: "",
    featured: false,
  });

  const { data: articles = [], isLoading } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/news", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Article published",
        description: `${formData.title} has been published successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/news/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setIsEditOpen(false);
      setSelectedArticle(null);
      resetForm();
      toast({
        title: "Article updated",
        description: `${formData.title} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/news/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'news');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleCreate = async () => {
    try {
      let imageUrl = formData.image;
      
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await uploadFile(imageFile);
      }

      const newsData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        author: formData.author,
        date: formData.date,
        readTime: formData.readTime,
        image: imageUrl,
        competition: formData.competition || undefined,
        featured: formData.featured,
      };

      createMutation.mutate(newsData);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedArticle) return;

    try {
      let imageUrl = formData.image;
      
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await uploadFile(imageFile);
      }

      const newsData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        author: formData.author,
        date: formData.date,
        readTime: formData.readTime,
        image: imageUrl,
        competition: formData.competition || undefined,
        featured: formData.featured,
      };

      updateMutation.mutate({ id: selectedArticle.id, data: newsData });
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    deleteMutation.mutate(id);
    toast({
      title: "Article deleted",
      description: `${title} has been removed.`,
    });
  };

  const openEditDialog = (article: News) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      author: article.author,
      date: article.date,
      readTime: article.readTime,
      image: article.image,
      competition: article.competition || "",
      featured: article.featured || false,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      author: "",
      date: "",
      readTime: "",
      image: "",
      competition: "",
      featured: false,
    });
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "match-report":
        return "default";
      case "announcement":
        return "secondary";
      case "news":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getCategoryIcon = (category: string) => {
    return category === "match-report" ? Trophy : Newspaper;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading news articles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">News Management</h2>
          <p className="text-muted-foreground">
            Create and manage news articles and announcements
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-news">
          <Plus className="h-4 w-4 mr-2" />
          Create Article
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-news"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            onClick={() => setCategoryFilter("all")}
            size="sm"
            data-testid="filter-all-news"
          >
            All
          </Button>
          <Button
            variant={categoryFilter === "match-report" ? "default" : "outline"}
            onClick={() => setCategoryFilter("match-report")}
            size="sm"
            data-testid="filter-match-reports"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Reports
          </Button>
          <Button
            variant={categoryFilter === "announcement" ? "default" : "outline"}
            onClick={() => setCategoryFilter("announcement")}
            size="sm"
            data-testid="filter-announcements"
          >
            Announcements
          </Button>
          <Button
            variant={categoryFilter === "news" ? "default" : "outline"}
            onClick={() => setCategoryFilter("news")}
            size="sm"
            data-testid="filter-news"
          >
            News
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => {
                const CategoryIcon = getCategoryIcon(article.category);
                return (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="w-20 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium line-clamp-1">{article.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {article.excerpt}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(article.category)}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {article.category === "match-report"
                          ? "Match Report"
                          : article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{article.author}</TableCell>
                    <TableCell>
                      {new Date(article.date).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(article)}
                          data-testid={`button-edit-news-${article.id}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(article.id, article.title)}
                          data-testid={`button-delete-news-${article.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No articles found matching your criteria
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create News Article</DialogTitle>
            <DialogDescription>
              Publish a new article, announcement or match report
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Spring Qualifier Results..."
                data-testid="input-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match-report">Match Report</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="John Smith"
                  data-testid="input-author"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Publish Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  data-testid="input-date"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="readTime">Read Time</Label>
                <Input
                  id="readTime"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="5 min read"
                  data-testid="input-read-time"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="competition">Competition (optional)</Label>
              <Input
                id="competition"
                value={formData.competition}
                onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                placeholder="Spring Carp Qualifier"
                data-testid="input-competition"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                data-testid="checkbox-featured"
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Feature this article on homepage
              </Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Upload Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                ref={fileInputRef}
                data-testid="input-image"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief summary of the article..."
                rows={2}
                data-testid="input-excerpt"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Full Content</Label>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Write your article content with formatting..."
                className="bg-background"
                style={{ height: '200px', marginBottom: '50px' }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || uploadingImage} data-testid="button-publish">
              {uploadingImage ? "Uploading..." : createMutation.isPending ? "Publishing..." : "Publish Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
            <DialogDescription>
              Update article details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-edit-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="select-edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match-report">Match Report</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-author">Author</Label>
                <Input
                  id="edit-author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  data-testid="input-edit-author"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Publish Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  data-testid="input-edit-date"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-readTime">Read Time</Label>
                <Input
                  id="edit-readTime"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  data-testid="input-edit-read-time"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-competition">Competition (optional)</Label>
              <Input
                id="edit-competition"
                value={formData.competition}
                onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                data-testid="input-edit-competition"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                data-testid="checkbox-edit-featured"
              />
              <Label htmlFor="edit-featured" className="cursor-pointer">
                Feature this article on homepage
              </Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image">Upload New Image (optional)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                ref={fileInputRef}
                data-testid="input-edit-image"
              />
              {formData.image && !imageFile && (
                <p className="text-sm text-muted-foreground">Current: {formData.image}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-excerpt">Excerpt</Label>
              <Textarea
                id="edit-excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                data-testid="input-edit-excerpt"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-content">Full Content</Label>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                className="bg-background"
                style={{ height: '200px', marginBottom: '50px' }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending || uploadingImage} data-testid="button-save-edit">
              {uploadingImage ? "Uploading..." : updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
