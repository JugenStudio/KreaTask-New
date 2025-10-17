import { GitCommit } from "lucide-react";
import type { Revision, User } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface RevisionWithAuthor extends Omit<Revision, 'author'> {
  author: User;
}

export function RevisionHistory({ revisions }: { revisions: RevisionWithAuthor[] }) {
  const { locale, t } = useLanguage();

  if (!revisions || revisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <GitCommit className="h-12 w-12 mb-4" />
        <p>{t('history.no_revisions')}</p>
        <p className="text-sm">{t('history.no_revisions_desc')}</p>
      </div>
    );
  }

  // Sort revisions by date, newest first
  const sortedRevisions = [...revisions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-headline font-semibold">{t('history.title')}</h3>
      <div className="relative pl-6">
        <div className="absolute left-0 top-0 h-full w-px bg-border" style={{transform: 'translateX(11px)'}} />
        {sortedRevisions.map((revision, index) => (
          <div key={revision.id} className="relative flex items-start pb-8">
             <Avatar className="absolute left-0 top-0.5 h-6 w-6 border-2 border-background">
                <AvatarImage src={revision.author.avatarUrl ?? undefined} alt={revision.author.name} />
                <AvatarFallback>{revision.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="pl-6">
              <p className="text-sm font-medium">{revision.author.name}</p>
              <p className="text-sm text-muted-foreground">{revision.change[locale]}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(revision.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
