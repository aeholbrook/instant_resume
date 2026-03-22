import { getRawResumeData } from '@/lib/resume';
import { filterContent, getAvailableProfiles } from '@/lib/profile-filter';
import ClassicResumeStack from '@/components/resume/ClassicResumeStack';

export const runtime = 'nodejs';

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { print?: string; printpreview?: string };
}) {
  const raw = await getRawResumeData();
  const profiles = getAvailableProfiles(raw);
  const data = filterContent(raw, params.slug);
  const printMode = searchParams.print !== undefined;
  const printPreview = searchParams.printpreview !== undefined;

  const stack = (
    <ClassicResumeStack
      data={data}
      profiles={profiles}
      currentProfile={params.slug}
      hideControls={printMode || printPreview}
    />
  );

  if (printPreview) {
    const PrintPreviewWrapper = (await import('@/components/PrintPreviewWrapper')).default;
    return <PrintPreviewWrapper>{stack}</PrintPreviewWrapper>;
  }

  return stack;
}
