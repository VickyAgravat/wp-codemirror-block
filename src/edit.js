/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from "@wordpress/i18n";

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import {
  useBlockProps,
  RichText,
  InspectorControls,
} from "@wordpress/block-editor";

import { useState, Fragment, useEffect } from "@wordpress/element";

import {
  PanelBody,
  TextControl,
  ToggleControl,
  SelectControl,
  ComboboxControl,
} from "@wordpress/components";

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import "./editor.scss";

import { modes } from "./codemirror/modes";

// import CodeMirrorEditor from './CodeMirrorEditor-wp';
// import CodeMirrorEditor from './codemirror/CodeMirrorEditor-react'
import CodeMirrorEditor from "./codemirror/CodeMirrorEditor";

const { panelOptions, defaults, themes } = window.wpcm;

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function Edit(props) {
  const { attributes, setAttributes, isSelected, insertBlocksAfter } = props;
  const {
    showPanel,
    languageLabel,
    fileName,
    mime,
    mode,
    theme,
    lineNumbers,
    firstLineNumber,
    lineWrapping,
    readOnly,
    styleActiveLine,
    disableCopy,
    content,
  } = attributes;

  const [themeOptions, setThemeOptions] = useState([]);
  // const [themeOptionsFiltered, setThemeOptionsFiltered] = useState([]);

  const [modeOptions, setModeOptions] = useState([]);
  const [modeOptionsFiltered, setModeOptionsFiltered] = useState([]);
  const [languageLabelClass, setLanguageLabelClass] = useState([]);
  const [languageLabelText, setLanguageLabelText] = useState('')

  useEffect(() => {
    let tmp = [];
    for (let i = 0; i < themes.length; i++) {
      if (i == 0) {
        tmp.push({ value: defaults.theme, label: "Default Theme" });
      }
      if (themes[i].value == defaults.theme) {
        tmp[0] = {
          value: defaults.theme,
          label: themes[i].label + " (Default Theme)",
        };
        continue;
      }
      tmp.push({
        value: themes[i].value,
        label: __(themes[i].label),
      });
    }
    setThemeOptions(tmp);
    // setThemeOptionsFiltered(tmp);
  }, [themes]);

  useEffect(() => {
    let tmp = [];
    let modeInfo = modes();
    for (var i = 0; i < modeInfo.length; i++) {
      var info = modeInfo[i];

      if (info.mime !== undefined) {
        tmp.push({ value: info.mime, label: __(info.name) });
      }
      if (info.mimes !== undefined) {
        for (var j = 0; j < info.mimes.length; j++) {
          if (j == 0) {
            tmp.push({
              value: info.mimes[j],
              label: __(info.name),
            });
          } else {
            tmp.push({
              value: info.mimes[j],
              label: __(info.name + " (" + info.mimes[j] + ")"),
            });
          }
        }
      }
    }
    setModeOptions(tmp);
    setModeOptionsFiltered(tmp);
  }, []);

  useEffect(() => {
    if (!mime) {
      let mime = defaults.mime;
      setAttributes({ mime: mime });
      setAttributes({ mode: getModeByMime(mime).mode });
      setAttributes({
        fileName: makeLanguageLabel(mime, languageLabel),
      });
    }
  }, [mime]);

  useEffect(() => {
    if (languageLabel == "no") {
      setAttributes({ fileName: "" });
      setLanguageLabelText('')
      setLanguageLabelClass([]);
    } else {
      let tmpLabelClass = [];
      let tmpLabelText = '' //fileName ? fileName : getModeByMime(mime).name;
      let tmpMime = mime ? mime : defaults.mime;
      let languageMode = getModeByMime(tmpMime);
      tmpLabelClass = [
        "language",
        languageMode.name.toLowerCase(),
        languageMode.mime
          ? languageMode.mime.replace(/\w+\/\w+[-.]/g, "")
          : languageMode.mimes[0].replace(/\w+\/\w+[-.]/g, ""),
        languageMode.ext ? languageMode.ext[0] : "",
      ];
      if (languageLabel == 'language') {
      	tmpLabelText = languageMode.name
      }
      if (languageLabel == 'file') {
      	tmpLabelText = fileName
      }
      setLanguageLabelClass(tmpLabelClass);
      setLanguageLabelText(tmpLabelText)
    }
  }, [mime, languageLabel]);

  const languageLabelOptions = () => {
    let languageLabels = [
      { label: "No Label", value: "no" },
      { label: "Language Name", value: "language" },
      { label: "File Name", value: "file" },
    ];
    let defaultValue =
      panelOptions.languageLabel === false ? "no" : panelOptions.languageLabel;

    let labelOptions = [];
    for (let i = 0; i < languageLabels.length; i++) {
      if (i == 0) {
        labelOptions.push({
          label: "Default Option",
          value: defaultValue,
        });
      }
      if (languageLabels[i].value == defaultValue) {
        labelOptions[0] = {
          value: defaultValue,
          label: languageLabels[i].label + " (Default)",
        };
        continue;
      }
      labelOptions.push({
        value: languageLabels[i].value,
        label: __(languageLabels[i].label),
      });
    }
    return labelOptions;
  };

  const getModeByMime = (mime) => {
    let modeInfo = modes();
    mime = mime.toLowerCase();
    for (var i = 0; i < modeInfo.length; i++) {
      var info = modeInfo[i];
      if (info.mime == mime) {
        return info;
      }
      if (info.mimes)
        for (var j = 0; j < info.mimes.length; j++) {
          if (info.mimes[j] == mime) {
            return info;
          }
        }
    }
  };

  // render functions
  const makeClassName = (classes) => {
    return classes.join(" ");
  };

  const onChangeLanguageLabel = (languageLabel) => {
    setAttributes({ languageLabel });
    setAttributes({ fileName: makeLanguageLabel(mime, languageLabel) });
  };

  const makeLanguageLabel = (mime, languageLabel) => {
    let mode = getModeByMime(mime);
    if (languageLabel == "file") {
      let modeFileName = mode.fileName ? mode.fileName : mode.mode; //"file";
      let modeFileExt = mode.ext ? mode.ext[0] : "";

      if (modeFileExt) {
        if (modeFileName == modeFileExt) {
          return "filename." + modeFileExt;
        }
      }
      return modeFileExt ? modeFileName + "." + modeFileExt : mode.name;
    }
    if (languageLabel == "language") {
      return mode.name;
    }
    return "";
  };

  const onChangeMode = (mime) => {
    // set mime
    setAttributes({ mime: mime });
    let modes = getModeByMime(mime);
    // set mode
    setAttributes({ mode: modes.mode });
    setAttributes({ fileName: makeLanguageLabel(mime, languageLabel) });
  };

  const onChangeLineNumber = (first) => {
    first = first && first < 1 ? 1 : first;
    // set firstLineNumber
    setAttributes({ firstLineNumber: first });
  };

  const onBlurLineNumber = () => {
    if (firstLineNumber < 1) {
      setAttributes({ firstLineNumber: 1 });
    }
  };

  const onChangeEditable = (readOnly) => {
    if (readOnly === true) {
      setAttributes({ disableCopy: false });
    }
    setAttributes({ readOnly: !readOnly });
  };

  const displayAlert = (message) => {
    alert(message + "\n\nThis button will work only on front end!");
  };

  const codemirrorOptions = {
    mime: mime,
    mode: mode,
    // lint: false,
    lineNumbers: lineNumbers,
    firstLineNumber: Math.abs(firstLineNumber),
    lineWrapping: lineWrapping,
    theme: theme,
    styleActiveLine: styleActiveLine,
    // hint: null,
    // styleSelectedText: true,
    scrollbarStyle: "simple",
    smartIndent: true,
    electricChars: true,
    // readOnly: 'nocursor',
  };

  let showRunButton = false;
  const executableModes = []; // ['htmlmixed', 'javascript', 'xml', 'jsx', 'vue']

  if (executableModes.includes(mode)) {
    showRunButton = window.wpcm.panelOptions.runButton ? true : false;
  }
  let showFullScreenButton = window.wpcm.panelOptions.fullScreenButton
    ? true
    : false;
  let showCopyButton = window.wpcm.panelOptions.copyButton
    ? !disableCopy
    : false;

  return (
    <div {...useBlockProps()}>
      <Fragment>
        <InspectorControls>
          <PanelBody initialOpen={true} title={__("CodeMirror Panel Settings")}>
            <ToggleControl
              label={__("Show Panel")}
              checked={showPanel}
              onChange={() => setAttributes({ showPanel: !showPanel })}
            />
            {showPanel && (
              <SelectControl
                label={__("Language Label")}
                value={languageLabel}
                help={__(
                  "Language label text. you can use it as file name also.",
                )}
                options={languageLabelOptions()}
                onChange={onChangeLanguageLabel}
              />
            )}
          </PanelBody>
          <PanelBody title={__("CodeMirror Settings")}>
            {/* <SelectControl
							label={__("Language / Mode")}
							value={mime}
							options={modeOptions}
							onChange={onChangeMode}
						/> */}
            <ComboboxControl
              label={__("Language / Mode")}
              value={mime}
              onChange={onChangeMode}
              options={modeOptionsFiltered}
              allowReset={false}
              onFilterValueChange={(inputValue) =>
                setModeOptionsFiltered(
                  modeOptions.filter((option) =>
                    option.label
                      .toLowerCase()
                      .startsWith(inputValue.toLowerCase()),
                  ),
                )
              }
            />
            <SelectControl
              label={__("Theme")}
              value={theme}
              options={themeOptions}
              onChange={(theme) => setAttributes({ theme })}
            />
            {/* <ComboboxControl
							label={ __( 'Theme' ) }
							value={ theme }
							onChange={ ( theme ) => setAttributes( { theme } ) }
							options={ themeOptionsFiltered }
							onFilterValueChange={ ( inputValue ) =>
								setThemeOptionsFiltered(
									themeOptions.filter( ( option ) =>
										option.label
											.toLowerCase()
											.startsWith(
												inputValue.toLowerCase()
											)
									)
								)
							}
						/> */}
            <h2>Editor Options</h2>
            <ToggleControl
              label={__("Editable on Frontend?")}
              checked={!readOnly}
              onChange={onChangeEditable}
            />
            {readOnly && (
              <ToggleControl
                label={__("Disable Copy on Frontend?")}
                checked={disableCopy}
                onChange={() =>
                  setAttributes({
                    disableCopy: !disableCopy,
                  })
                }
              />
            )}
          </PanelBody>
          <PanelBody initialOpen={false} title={__("Line Settings")}>
            <ToggleControl
              label={__("Show Line Numbers?")}
              checked={lineNumbers}
              onChange={() => setAttributes({ lineNumbers: !lineNumbers })}
            />
            {lineNumbers && (
              <TextControl
                label={__("First Line Number")}
                type="number"
                value={firstLineNumber}
                onChange={onChangeLineNumber}
                onBlur={onBlurLineNumber}
                min="1"
              />
            )}
            <ToggleControl
              label={__("Highlight Active Line?")}
              checked={styleActiveLine}
              onChange={() =>
                setAttributes({
                  styleActiveLine: !styleActiveLine,
                })
              }
            />
            <ToggleControl
              label={__("Warp Long Line?")}
              checked={lineWrapping}
              onChange={() =>
                setAttributes({
                  lineWrapping: !lineWrapping,
                })
              }
            />
          </PanelBody>
        </InspectorControls>

        <div className="codeMirror-editor">
          <div
            className={makeClassName([
              "CodeMirror CodeMirror-panel",
              "cm-s-" + theme,
            ])}
          >
            <div
              className={makeClassName([
                "info-panel",
                showPanel ? "" : "hide-panel",
              ])}
            >
              <RichText
                tagName="span"
                className={makeClassName(languageLabelClass)}
                value={languageLabelText}
                onChange={(fileName) => setAttributes({ fileName: fileName })}
                autoFocus={false}
              />
              <div className="control-panel">
                {showRunButton && (
                  <span
                    title="It Execute Code on Front End"
                    onClick={() => displayAlert("It Execute Code on Front End")}
                  >
                    <b className="run-code execute-code"></b>
                  </span>
                )}
                {showFullScreenButton && (
                  <span
                    title="To Set Full Screen on Front End"
                    onClick={() =>
                      displayAlert("To Set Full Screen on Front End")
                    }
                  >
                    <b className="fullscreen maximize"></b>
                  </span>
                )}
                {showCopyButton && (
                  <span
                    title="Copy Code on Front End"
                    onClick={() => displayAlert("Copy Code on Front End")}
                  >
                    <b className="copy"></b>
                  </span>
                )}
              </div>
            </div>
          </div>
          <CodeMirrorEditor
            key="code"
            placeholder={__(
              "/** Write or Paste Your Code Here \n And Select Code Language Mode, by default (javaScript) Mode is selected",
            )}
            value={String(content)}
            options={codemirrorOptions}
            showPanel={showPanel}
            onChange={(content) => setAttributes({ content })}
            autoFocus={isSelected}
            isSelected={isSelected}
            insertBlocksAfter={insertBlocksAfter}
          />
          {/* <RichText
						tagName="div"
						value={content}
						onChange={content => setAttributes({ content })}
					/> */}
        </div>
      </Fragment>
    </div>
  );
}
