import styles from "./Emojify.module.css";
import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import OpenAI from "openai";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MicIcon from "@mui/icons-material/Mic";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import logo from "./static/emojify_logo.png";
import CircularProgress from "@mui/material/CircularProgress";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Fab from "@mui/material/Fab";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import Slider from "@mui/material/Slider";
import Tooltip from "@mui/material/Tooltip";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function Emojify() {
  const [inputText, setInputText] = useState("");
  const [customTone, setCustomTone] = useState("");
  const [outputText, setOutputText] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [density, setDensity] = useState(20);
  const [selectedTone, setSelectedTone] = useState("default");
  const [tooLong, setTooLong] = useState(false);
  const [explanations, setExplanations] = useState(["", "", ""]);
  // const [feedbackInputForm, setFeedbackInputForm] = useState("");
  // const [userFeedback, setUserFeedback] = useState("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    setCharCount(inputText.length);
  }, [inputText]);

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  // const handleFeedbackInputChange = (event) => {
  //   setFeedbackInputForm(event.target.value);
  // };

  const densityToPrompt = {
    0: "Use emojis very sparingly.",
    10: "Use emojis sparingly.",
    20: "",
    30: "Use emojis generously.",
    40: "Use an absurdly large amount of emojis.",
  };

  // const handleFeedbackClick = async () => {
  //   setUserFeedback(feedbackInputForm);
  //   console.log("user feedback is now ", userFeedback);
  // };

  const handleEmojifyClick = async () => {
    if (inputText === "") {
      return;
    }
    setLoading(true);
    setExplanations(["", "", ""]);
    try {
      const messages = [
        // {
        //   role: "system",
        //   content: userFeedback
        // },
        {
          role: "system",
          content: "You help add emojies appropriately to text messages.",
        },
        {
          role: "user",
          content: `Given the following text message, add emojies appropriately throughout the text. Give me a json object of three possible variations with numbers as the json keys. Don't include any additional markups. Here's the message: "${inputText}"`,
        },
      ];
      if (density !== 20) {
        messages.push({ role: "user", content: densityToPrompt[density] });
      }
      if (selectedTone !== "default") {
        messages.push({
          role: "user",
          content: `Try to create a ${selectedTone} tone.`,
        });
      }
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
      });

      // output looks like { "1": "what's good gang 👋", "2": "what's good gang 🤙", "3": "what's good gang 💪" }
      let output = response.choices[0].message.content;
      console.log("EMOJIFY output is" + output);
      output = Object.values(JSON.parse(output));
      setOutputText(output);
    } catch (error) {
      console.error("Error:", error);
      setOutputText([-1]);
    }
    setLoading(false);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const handleCloseCopy = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setCopied(false);
  };

  const handleCloseTooLong = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setTooLong(false);
  };

  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      if (transcript.length > 200) {
        setTooLong(true);
        return;
      }
      setInputText(transcript);
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const settingsOpen = Boolean(anchorEl);
  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleSettingsClose = () => {
    if (selectedTone === "") {
      setSelectedTone("default");
    }
    setAnchorEl(null);
  };
  const marks = [
    {
      value: 0,
      label: "A Few",
    },
    {
      value: 20,
      label: "Default",
    },
    {
      value: 40,
      label: "A Lot",
    },
  ];

  const handleDensityChange = (event, newValue) => {
    setDensity(newValue);
  };

  const handleToneChange = (event) => {
    setCustomTone("");
    setSelectedTone(event.target.value);
  };

  const handleCustomToneChange = (event) => {
    setSelectedTone(event.target.value);
    setCustomTone(event.target.value);
  };

  const handleOutputExplanation = async (text, index) => {
    let updatedExplanations = [...explanations];
    updatedExplanations[index] = "loading";
    setExplanations(updatedExplanations);
    try {
      const messages = [
        {
          role: "system",
          content: "You interpret messages and their emojis for the user.",
        },
        {
          role: "user",
          content: `Given the following text message, give a very short (couple sentences) analysis of the message's tone/meaning and how the emojis contribute to that: "${text}"`,
        },
      ];
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
      });

      let output = response.choices[0].message.content;
      let updatedExplanations = [...explanations];
      updatedExplanations[index] = output;
      setExplanations(updatedExplanations);
    } catch (error) {
      console.error("Error:", error);
      let updatedExplanations = [...explanations];
      updatedExplanations[index] = "Ack! Something goofed, try clicking again";
      setExplanations(updatedExplanations);
    }
  };

  return (
    <div>
      <img src={logo} alt="Emojify Logo" className={styles.logo} />
      <div className={styles.input_container}>
        <Stack spacing={2} direction="row" alignItems="flex-start">
          <Tooltip
            title="Listening, click again when done!"
            arrow
            open={listening}
            disableFocusListener
            disableHoverListener
            disableTouchListener
          >
            <Box
              sx={{ m: 1, position: "relative" }}
              style={{ marginTop: "4px" }}
            >
              <Fab
                aria-label="listen"
                color="primary"
                onClick={handleMicClick}
                size={"medium"}
              >
                <MicIcon />
              </Fab>
              {listening && (
                <CircularProgress
                  size={56}
                  sx={{
                    position: "absolute",
                    top: -4,
                    left: -4,
                    zIndex: 1,
                  }}
                />
              )}
            </Box>
          </Tooltip>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <TextField
              id="outlined-basic"
              label="Text to emojify"
              variant="outlined"
              multiline
              inputProps={{ maxLength: 200, style: { maxWidth: "230px" } }}
              sx={{ minWidth: 300 }}
              value={inputText}
              onChange={handleInputChange}
              // enter to submit, shift+enter to linebreak
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleEmojifyClick();
                }
              }}
            />
            {charCount > 0 && (
              <p
                style={{
                  position: "absolute",
                  top: -35,
                  right: 0,
                  fontSize: "14px",
                  color: "gray",
                }}
              >
                {charCount}/200
              </p>
            )}
          </div>
          <div
            style={{
              marginTop: "8px",
              marginLeft: "-45px",
              marginRight: "5px",
            }}
          >
            <IconButton
              id="basic-button"
              aria-controls={settingsOpen ? "basic-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={settingsOpen ? "true" : undefined}
              onClick={handleSettingsClick}
            >
              <SettingsIcon />
            </IconButton>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={settingsOpen}
              onClose={handleSettingsClose}
              MenuListProps={{
                "aria-labelledby": "basic-button",
              }}
            >
              <p
                style={{
                  marginBottom: "5px",
                  marginTop: "0px",
                  marginLeft: "10px",
                  fontWeight: "bold",
                }}
              >
                Emoji Quantity
              </p>
              <Box sx={{ width: 250, paddingX: "30px" }}>
                <Slider
                  aria-label="Density"
                  value={density}
                  onChange={handleDensityChange}
                  shiftStep={10}
                  step={10}
                  marks={marks}
                  min={0}
                  max={40}
                />
              </Box>
              <p
                style={{
                  marginBottom: "5px",
                  marginTop: "10px",
                  marginLeft: "10px",
                  fontWeight: "bold",
                }}
              >
                Desired Tone
              </p>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                value={selectedTone}
                onChange={handleToneChange}
                sx={{ width: 310 }}
              >
                <FormControlLabel
                  value="default"
                  control={<Radio size="small" />}
                  label="Default"
                  labelPlacement="bottom"
                />
                <FormControlLabel
                  value="happy"
                  control={<Radio size="small" />}
                  label="Happy"
                  labelPlacement="bottom"
                />
                <FormControlLabel
                  value="sad"
                  control={<Radio size="small" />}
                  label="Sad"
                  labelPlacement="bottom"
                />
                <FormControlLabel
                  value="angry"
                  control={<Radio size="small" />}
                  label="Angry"
                  labelPlacement="bottom"
                />
                <TextField
                  id="standard-basic"
                  label="Other"
                  variant="standard"
                  inputProps={{ maxLength: 20, style: { maxWidth: "230px" } }}
                  sx={{ width: 175, marginTop: "5px", marginLeft: "20px" }}
                  value={customTone}
                  onChange={handleCustomToneChange}
                />
              </RadioGroup>
            </Menu>
          </div>
          <Button
            variant="contained"
            style={{ minWidth: "fit-content", marginTop: "9.75px" }}
            onClick={handleEmojifyClick}
          >
            Emojify
          </Button>
        </Stack>
      </div>
      {!browserSupportsSpeechRecognition && (
        <p style={{ fontStyle: "italic", textAlign: "center" }}>
          Please allow access to mic for speech-to-text functionality
        </p>
      )}
      {loading && (
        <div className={styles.progress_container}>
          <CircularProgress />
        </div>
      )}
      {outputText[0] === -1 && !loading && (
        <p style={{ fontStyle: "italic", textAlign: "center" }}>
          Ack! Something went wrong. Try emojifying again!
        </p>
      )}
      {outputText.length > 0 && outputText[0] !== -1 && !loading && (
        <div>
          <div className={styles.output_container}>
            <p>We think you might like these:</p>
            {outputText.map((text, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  maxWidth: "900px",
                  margin: "0 auto",
                }}
              >
                <div style={{ display: "inline-block" }}>
                  <Tooltip
                    title={
                      explanations[index] === "" ? (
                        "Click for an explanation!"
                      ) : explanations[index] === "loading" ? (
                        <CircularProgress
                          style={{ color: "white" }}
                          size={20}
                        />
                      ) : (
                        explanations[index]
                      )
                    }
                    placement="left"
                    arrow
                  >
                    <IconButton
                      onClick={() => handleOutputExplanation(text, index)}
                    >
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </div>
                <p style={{ wordWrap: "break-word", flex: "1" }}>{text}</p>
                <div style={{ display: "inline-block" }}>
                  <Tooltip title="Copy to Clipboard" placement="right">
                    <IconButton onClick={() => handleCopyToClipboard(text)}>
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontStyle: "italic", textAlign: "center" }}>
            Not quite what you were looking for? Try clicking "Emojify" again!
          </p>
          {/* <TextField
            style={{
              display: "flex",
              justifyContent: "center",
              maxWidth: "200px",
              margin: "0 auto",
            }}
            id="outlined-basic"
            label="Feedback for the AI to use for next Emojify"
            variant="outlined"
            multiline
            inputProps={{ maxLength: 200, style: { maxWidth: "230px" } }}
            sx={{ minWidth: 300 }}
            value={feedbackInputForm}
            onChange={handleFeedbackInputChange}
            // enter to submit, shift+enter to linebreak
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleFeedbackClick();
              }
            }}
          /> */}
        </div>
      )}
      <Snackbar
        open={copied}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={3000}
        onClose={handleCloseCopy}
        message="Copied to clipboard!"
      />
      <Snackbar
        open={tooLong}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={4000}
        onClose={handleCloseTooLong}
        message="Message too long, try again!"
      />
    </div>
  );
}

export default Emojify;