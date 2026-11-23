import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AndroidBackButton } from "../components/AndroidBackButton";
import { BottomNavigation } from "../components/BottomNavigation";
import { MobileHome } from "../features/home/MobileHome";
import { HymnReader } from "../features/hymns/HymnReader";
import { HymnsScreen } from "../features/hymns/HymnsScreen";
import { BibleChapterScreen } from "../features/bible/BibleChapterScreen";
import { BibleScreen } from "../features/bible/BibleScreen";
import { FormatSettings } from "../features/settings/FormatSettings";
import { SettingsScreen } from "../features/settings/SettingsScreen";

function HymnRoute() {
  const { hymnalSlug = "", number } = useParams();
  return <HymnReader hymnalSlug={hymnalSlug} number={Number(number) || 0} />;
}

function BibleChapterRoute() {
  const { bookId = "", chapter } = useParams();
  return <BibleChapterScreen bookId={bookId} chapterNumber={Number(chapter) || 1} />;
}

export default function MobileApp() {
  return (
    <div className="mobile-root">
      <AndroidBackButton />
      <Routes>
        <Route path="/" element={<MobileHome />} />
        <Route path="/canticos" element={<HymnsScreen />} />
        <Route path="/canticos/:hymnalSlug/:number" element={<HymnRoute />} />
        <Route path="/biblia" element={<BibleScreen />} />
        <Route path="/biblia/:bookId/:chapter" element={<BibleChapterRoute />} />
        <Route path="/configuracion" element={<SettingsScreen />}>
          <Route path="estilos" element={<FormatSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNavigation />
    </div>
  );
}
