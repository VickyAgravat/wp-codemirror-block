if ("undefined" === typeof window.wpcm.editors) {
  window.wpcm.executed = false;
  window.wpcm.editors = [];
}

(function (wpcm, CodeMirror) {
  "use strict";
  wpcm.executableModes = []; // ['htmlmixed', 'javascript', 'xml', 'jsx', 'vue']

  wpcm.frontEndInitialization = function () {
    let codeBlocks = document.querySelectorAll(".code-block > pre.CodeMirror");
    wpcm.addNotice();

    for (let i = 0; i < codeBlocks.length; i++) {
      const block = codeBlocks[i];
      if (!block.dataset.setting) {
        continue;
      }
      let options = JSON.parse(block.dataset.setting),
        code = block.textContent,
        id = "code-block-" + i;
      block.parentNode.setAttribute("id", i);
      // codeBlocks.id = i;
      block.setAttribute("id", id);

      wpcm.codeMirrorInit(id, code, options, i);
    }
    // this event triggers with all editor instance
    let event = new CustomEvent("wpcm_editors_loaded");
    document.dispatchEvent(event);
    // $(document.body).trigger('wpcm_editors_loaded')
  };

  wpcm.codeMirrorInit = function (id, code, options) {
    const el = document.getElementById(id);

    el.style = "display: none";
    const editor = CodeMirror(el.parentNode, {
      // value: code,
      lineNumbers: options.lineNumbers,
      lineWrapping: options.lineWrapping,
      readOnly: options.readOnly,
      scrollbarStyle: "simple",
      firstLineNumber: options.firstLineNumber
        ? Math.abs(options.firstLineNumber)
        : 1,
    });

    if (wpcm.editorOptions.maxHeight) {
      let cmEl = editor.getWrapperElement();
      cmEl.classList.add("max-height");
      cmEl.style.setProperty("height", options.maxHeight);
      cmEl.style.setProperty("padding-bottom", "2rem");
    }

    CodeMirror.autoLoadTheme(editor, options.theme);

    editor.setValue(code);
    if (options.disableCopy) {
      editor.setOption("readOnly", "nocursor");
    }
    // editor.setOption("autoRefresh", 1000);

    editor.setOption("mode", options.mime);
    editor.setOption("theme", options.theme);

    if (options.styleActiveLine) {
      editor.on("blur", (e) => {
        editor.setOption("styleActiveLine", false);
      });
      editor.on("focus", (e) => {
        editor.setOption("styleActiveLine", options.styleActiveLine);
      });
    }

    CodeMirror.autoLoadMode(editor, options.mode);

    if (options.showPanel === true && wpcm.panelOptions.showPanel) {
      editor
        .getWrapperElement()
        .querySelector(".CodeMirror-simplescroll-vertical");
      // .classList.add('adjust-top')
      wpcm.addPanel(editor, options);
    }

    // if (wpcm.executableModes.includes(options.mode)) {
    //   wpcm.renderOutputBlock(el);
    // }

    wpcm.editors.push(editor);

    // $(document.body).trigger('wpcm_editor_loaded', [editor])
    // Listen for the event.
    // document.addEventListener('wpcm_editor_loaded', function (e) { return editor }, false);
    // Dispatch the event.
    // document.dispatchEvent(wpcm_editor_loaded);
    let event = new CustomEvent("wpcm_editor_loaded", { detail: editor });
    document.dispatchEvent(event);
  };

  wpcm.addNotice = function () {
    const div = document.createElement("div");
    div.className = "CodeMirror-notice";
    document.body.appendChild(div);
  };

  wpcm.showNotice = function (notice, style) {
    const div = document.querySelector(".CodeMirror-notice");
    div.innerHTML = notice;
    div.setAttribute("style", "bottom: 15px");

    setTimeout(() => {
      div.removeAttribute("style");
    }, 3000);
  };

  wpcm.addPanel = function (editor, options) {
    const panel = document.createElement("div"),
      info = document.createElement("div"),
      controls = document.createElement("div"),
      language = document.createElement("span"),
      wrapper = editor.getWrapperElement();

    panel.className = "CodeMirror-panel";
    info.className = "info-panel";
    if (wpcm.editorOptions.maxHeight) {
      info.classList.add("max-height");
    }

    controls.className = "control-panel";

    // if (options.languageLabel === 'no') {
    // } else if (options.languageLabel === 'language') {
    // 	language.textContent = options.language
    // 	language.className = 'language ' + options.modeName.toLowerCase()
    // } else if (options.languageLabel === 'file') {
    // 	language.textContent = options?.fileName ? options.fileName : options.language
    // 	language.className = 'language ' + options.modeName.toLowerCase()
    // }

    if (options.languageLabel !== "no") {
      language.textContent = options?.fileName
        ? options.fileName
        : options.language;
      language.className = "language " + options.modeName.toLowerCase();
    }

    info.appendChild(language);

    if (window.wpcm.panelOptions.runButton) {
      if (wpcm.executableModes.includes(options.mode)) {
        let run = document.createElement("span"),
          runButton = document.createElement("b");
        run.classList = "tool";
        run.setAttribute("data-tip", "Execute Code");
        // run.setAttribute('title', 'Execute Code');

        runButton.className = "run-code execute-code";
        run.onclick = wpcm.executeCode;
        run.appendChild(runButton);
        controls.appendChild(run);
      }
    }

    if (window.wpcm.panelOptions.fullScreenButton) {
      const fullScreen = document.createElement("span"),
        fullScreenButton = document.createElement("b");

      fullScreen.classList = "tool";
      fullScreen.setAttribute("data-tip", "Full Screen");
      // fullScreen.setAttribute('title', 'Full Screen');

      fullScreenButton.className = "fullscreen maximize";
      fullScreenButton.onclick = wpcm.setFullScreen;
      fullScreen.appendChild(fullScreenButton);
      controls.appendChild(fullScreen);
    }

    if (window.wpcm.panelOptions.copyButton) {
      if (!options.disableCopy) {
        const copy = document.createElement("span"),
          copyButton = document.createElement("b");

        copy.classList = "tool";
        copy.setAttribute("data-tip", "Copy Code");
        // copy.setAttribute('title', 'Copy Code');

        copyButton.className = "copy";
        copyButton.onclick = wpcm.copyToClipboard;
        copy.appendChild(copyButton);

        controls.appendChild(copy);
      }
    }

    info.appendChild(controls);
    panel.appendChild(info);

    wrapper.insertBefore(panel, wrapper.firstChild);
  };

  // wpcm.executeCode = function (e) {
  //   const el = this,
  //     code_block = el.closest(".code-block"),
  //     editorId = code_block.id,
  //     editor = wpcm.editors[editorId],
  //     editorContent = editor.getValue(),
  //     output_frame = code_block.querySelector(".output-block-frame");
  //   let iframe = null;

  //   output_frame.classList.add("show");

  //   iframe = output_frame.contentWindow
  //     ? output_frame.contentWindow
  //     : output_frame.contentDocument.document
  //     ? output_frame.contentDocument.document
  //     : output_frame.contentDocument;
  //   iframe.setAttribute("sandbox", "allow-scripts");
  //   iframe.document.open();
  //   iframe.document.write(editorContent);
  //   iframe.document.close();

  //   // output_frame.animate(
  //   // 	{ transform: 'rotate(360deg)' }
  //   // 	, {
  //   // 		duration: 600,        // number in ms [this would be equiv of your speed].
  //   // 		easing: 'ease-in-out',
  //   // 		iterations: 1,         // infinity or a number.
  //   // 		// fill: ''
  //   // 	})
  //   window.scrollTo({
  //     top: output_frame.offsetTop,
  //     left: 100,
  //     behavior: "smooth",
  //   });
  //   // $('html, body').animate({
  //   // 	scrollTop: $(output_frame).offset().top - 80,
  //   // }, 600)
  //   // function move(elem) {
  //   // 	var left = 0
  //   // 	function frame() {
  //   // 		left++  // update parameters
  //   // 		elem.style.left = left + 'px' // show frame
  //   // 		if (left == 100)  // check finish condition
  //   // 			clearInterval(id)
  //   // 	}
  //   // 	var id = setInterval(frame, 10) // draw every 10ms
  //   // }
  //   // move(output_frame)
  // };

  // to set height of output frame after load
  // wpcm.styleOutputBlock = function (e) {
  //   let output_frame = e.target,
  //     iframe = null,
  //     newHeight = 0;

  //   if (output_frame.classList.contains("first-load")) {
  //     output_frame.classList.remove("first-load");
  //     return;
  //   }

  //   iframe = output_frame.contentWindow
  //     ? output_frame.contentWindow
  //     : output_frame.contentDocument.document
  //     ? output_frame.contentDocument.document
  //     : output_frame.contentDocument;

  //   output_frame.setAttribute("style", "height:200px");
  //   if (iframe.document.body) {
  //     // iframe.document.body.style.overflow = 'hidden';
  //     newHeight = Math.round(iframe.document.body.scrollHeight) + 25;
  //     if (newHeight > 200) {
  //       output_frame.setAttribute("style", `height:${newHeight}px`);
  //     }
  //   } else {
  //     output_frame.setAttribute("style", "height:70vh");
  //   }
  // };

  // wpcm.renderOutputBlock = function (el) {
  //   const iframe = document.createElement("iframe");
  //   iframe.setAttribute("sandbox", "allow-scripts");
  //   iframe.classList.add("output-block-frame", "first-load");
  //   iframe.onload = wpcm.styleOutputBlock;
  //   iframe.style.height = "100px";
  //   iframe.src = "";
  //   el.parentNode.append(iframe);
  // };

  wpcm.setFullScreen = function () {
    const el = this,
      code_block = el.closest(".code-block"),
      editorId = code_block.id,
      editor = wpcm.editors[editorId],
      adminBar = document.getElementById("wpadminbar"),
      cmWrapper = el.closest(".CodeMirror");

    if (el.classList.contains("maximize")) {
      el.classList.remove("maximize");
      el.classList.add("restore");
      cmWrapper.classList.add("CodeMirror-fullscreen");

      // add top position to fix 'wp-admin bar'
      if (typeof adminBar != "undefined" && adminBar != null) {
        // el.closest('.CodeMirror').classList.add('adjust-top')
        el.closest(".CodeMirror").style.setProperty(
          "top",
          `${adminBar.clientHeight}px`
        );
      }

      if (wpcm.editorOptions.maxHeight) {
        cmWrapper.style.removeProperty("height");
        cmWrapper.style.setProperty("padding-bottom", "2rem");
      }

      document.documentElement.style.setProperty("overflow", "hidden");
    } else {
      el.classList.remove("restore");
      el.classList.add("maximize");
      // el.closest('.CodeMirror').classList.remove('CodeMirror-fullscreen', 'adjust-top')
      cmWrapper.classList.remove("CodeMirror-fullscreen");
      cmWrapper.style.removeProperty("top");
      document.documentElement.style.removeProperty("overflow");

      if (wpcm.editorOptions.maxHeight) {
        cmWrapper.style.setProperty("height", wpcm.editorOptions.maxHeight);
      } else {
        cmWrapper.style.removeProperty("padding-bottom");
      }
    }
    editor.refresh();
  };

  wpcm.copyToClipboard = function () {
    const el = this,
      code_block = el.closest(".code-block"),
      editorId = code_block.id,
      content = wpcm.editors[editorId].getValue();
    let notice;

    if (window.clipboardData) {
      // For Internet Explorer
      // console.log('clipboard data');
      window.clipboardData.setData("Text", content);
    } else {
      const textarea = document.createElement("textarea");

      textarea.className = "CodeMirror-ClipBoard";
      document.body.appendChild(textarea);
      textarea.appendChild(document.createTextNode(content));
      textarea.select();
      try {
        // Now that we've selected the anchor text, execute the copy command
        let successful = document.execCommand("copy");
        notice = successful ? "Copied to clipboard" : "Can not copied";
      } catch (err) {
        notice = "Oops, unable to copy";
      }
      // console.log(notice);
      textarea.remove();
    }
    wpcm.showNotice(notice, "");
  };
})(window.wpcm, window.CodeMirror);

// Front End Initialization
if (window.wpcm.executed === false) {
  window.wpcm.executed = true;
  wpcm.frontEndInitialization();
}

window.addEventListener(
  "load",
  function () {
    console.log("window ready");
    // to refresh the editor on some browser
    setTimeout(() => {
      for (let i = 0; i < wpcm.editors.length; i++) {
        wpcm.editors[i].refresh();
      }
    }, 1500);
  },
  false
);

// to refresh the editor on some browser
// let loadRefreshSet = false
// const refreshAll = function () {
// 	console.log('refresh ready')
// 	for (var i = 0; i < wpcm.editors.length; i++) {
// 		wpcm.editors[i].refresh()
// 	}
// }
// const callRefresh = () => {
// 	if (!loadRefreshSet) {
// 		loadRefreshSet = true
// 		document.removeEventListener('mousemove', callRefresh)
// 		document.removeEventListener('scroll', callRefresh)
// 		setTimeout(() => refreshAll(), 500)
// 	}
// }
// document.addEventListener('mousemove', callRefresh)
// document.addEventListener('scroll', callRefresh)
