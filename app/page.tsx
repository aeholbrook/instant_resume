import { getRawResumeData } from '@/lib/resume';
import { getAvailableProfiles } from '@/lib/profile-filter';
import ResumeViewer from '@/components/ResumeViewer';

export const runtime = 'nodejs';

export default async function Page({
  searchParams,
}: {
  searchParams: { profile?: string; print?: string; printpreview?: string };
}) {
  const raw = await getRawResumeData();
  const profiles = getAvailableProfiles(raw);
  const printMode = searchParams.print !== undefined;
  const printPreview = searchParams.printpreview !== undefined;

  if (printMode || printPreview) {
    const { filterContent } = await import('@/lib/profile-filter');
    const data = filterContent(raw, searchParams.profile || undefined);
    const ClassicResumeStack = (await import('@/components/resume/ClassicResumeStack')).default;
    if (printPreview) {
      const PrintPreviewWrapper = (await import('@/components/PrintPreviewWrapper')).default;
      return <PrintPreviewWrapper><ClassicResumeStack data={data} hideControls /></PrintPreviewWrapper>;
    }
    return <ClassicResumeStack data={data} hideControls />;
  }

  return (
    <ResumeViewer
      rawData={raw}
      profiles={profiles}
      initialProfile={searchParams.profile}
    />
  );
}
