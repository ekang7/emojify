import "./App.css";
import Emojify from "./Emojify";
import EmojiAnalysis from "./EmojiAnalysis";
import EmojiSearch from "./EmojiSearch";
import React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import EmojiTranslate from "./EmojiTranslate";
function App() {
  const [tab, setTab] = React.useState(0);

  const handleTabChange = (event, newTab) => {
    setTab(newTab);
  };

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* tab code */}
      <Box
        sx={{
          width: "100%",
          bgcolor: "background.paper",
          position: "fixed",
          top: "0px",
        }}
      >
        <Tabs value={tab} onChange={handleTabChange} centered>
          <Tab label="Emojify" />
          <Tab label="Emoji Search" />
          <Tab label="Emoji Analyzer" />
          <Tab label="Emoji Translate" />
        </Tabs>
      </Box>
      {tab === 0 && <Emojify />}
      {tab === 1 && <EmojiSearch />}
      {tab === 2 && <EmojiAnalysis />}
      {tab === 3 && <EmojiTranslate />}
      <p
        style={{
          marginTop: "auto",
          textAlign: "center",
          width: "100%",
        }}
      >
        By Nathan Li & Edward Kang
      </p>
    </div>
  );
}

export default App;
