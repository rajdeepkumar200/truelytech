import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Journal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedEntries = localStorage.getItem("journal-entries");
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  useEffect(() => {
    if (date) {
      const dateKey = format(date, "yyyy-MM-dd");
      setEntry(entries[dateKey] || "");
    }
  }, [date, entries]);

  const handleSave = () => {
    if (!date) return;
    
    const dateKey = format(date, "yyyy-MM-dd");
    const newEntries = { ...entries, [dateKey]: entry };
    
    setEntries(newEntries);
    localStorage.setItem("journal-entries", JSON.stringify(newEntries));
    
    toast({
      title: "Entry saved",
      description: "Your journal entry has been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Daily Journal</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow-sm"
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>
                {date ? format(date, "EEEE, MMMM do, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <Textarea
                placeholder="Write your thoughts for today..."
                className="min-h-[300px] resize-none text-lg leading-relaxed"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Journal;
