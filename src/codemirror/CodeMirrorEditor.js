/**
 * WordPress dependencies
 */
// import { Component } from '@wordpress/element';
import { navigateRegions } from '@wordpress/components';

import { useEffect, useState, useRef } from '@wordpress/element';

import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

import { UP, DOWN } from '@wordpress/keycodes';

// https://github.com/WordPress/gutenberg/blob/3.8/components/code-editor/editor.js

const { CodeMirror } = window;

export default function CodeMirrorEditor( props ) {
	const { options, showPanel, isSelected, insertBlocksAfter } = props;
	const {
		mime,
		mode,
		theme,
		lineNumbers,
		firstLineNumber,
		lineWrapping,
		styleActiveLine,
	} = options;

	const showPanelRef = useRef( showPanel );
	const editorRef = useRef( null );
	const editor = useRef( null );
	const lastCursor = useRef( null );
	const [ selectAll, setSelectAll ] = useState( false );

	useEffect( () => {
		editor.current = CodeMirror.fromTextArea(
			editorRef.current,
			props.options
		);

		let wrapper = editor.current.getWrapperElement();
		if ( showPanel === true ) {
			wrapper.classList.add( 'has-panel' );
		}

		editor.current.setOption( 'mode', mime );
		CodeMirror.autoLoadMode( editor.current, mode );
		CodeMirror.autoLoadTheme( editor.current, theme );

		editor.current.on( 'blur', onBlur );
		editor.current.on( 'change', onValueChange );
		editor.current.on( 'cursorActivity', onCursorActivity );
		editor.current.on( 'focus', onFocus );
		editor.current.on( 'keyHandled', onKeyHandled );

		// Pass a reference to the editor back up.
		if ( props.editorRef ) {
			props.editorRef( editor.current );
			updateFocus();
		}
	}, [] );

	useEffect( () => {
		if ( isSelected === true && showPanel === false ) {
			if ( ! editor.current.hasFocus() ) editor.current.focus();
		}
	}, [ isSelected, showPanel ] );

	useEffect( () => {
		editor.current.setOption( 'theme', theme );
		CodeMirror.autoLoadTheme( editor.current, theme );
	}, [ theme ] );

	useEffect( () => {
		editor.current.setOption( 'mode', mime );
		CodeMirror.autoLoadMode( editor.current, mode );
	}, [ mode ] );

	useEffect( () => {
		editor.current.setOption( 'lineNumbers', lineNumbers );
	}, [ lineNumbers ] );

	useEffect( () => {
		editor.current.setOption( 'lineWrapping', lineWrapping );
	}, [ lineWrapping ] );

	useEffect( () => {
		editor.current.setOption( 'styleActiveLine', styleActiveLine );
	}, [ styleActiveLine ] );

	useEffect( () => {
		editor.current.setOption( 'firstLineNumber', firstLineNumber );
	}, [ firstLineNumber ] );

	useEffect( () => {
		let wrapper = editor.current.getWrapperElement();
		showPanelRef.current = showPanel;
		if ( showPanel === true ) {
			wrapper.classList.add( 'has-panel' );
		} else {
			wrapper.classList.remove( 'has-panel' );
		}
	}, [ showPanel ] );

	const onFocus = () => {
		if ( props.onFocus ) {
			props.onFocus();
		}
	};

	const onBlur = ( editor ) => {
		if ( props.onChange ) {
			props.onChange( editor.getValue() );
		}
		setSelectAll( true );
	};

	const onCursorActivity = ( instance ) => {
		// console.log('onCursorActivity', instance.getCursor())
		lastCursor.current = instance.getCursor();
	};

	const onKeyHandled = ( instance, name, event ) => {
		// https://github.com/WordPress/gutenberg/tree/e38dbe958c04d8089695eb686d4f5caff2707505/packages/components/src/higher-order/navigate-regions
		/*
		 * Pressing UP/DOWN should only move focus to another block if the cursor is
		 * at the start or end of the editor.
		 *
		 * We do this by stopping UP/DOWN from propagating if:
		 *  - We know what the cursor was before this event; AND
		 *  - This event caused the cursor to move
		 */
		const eventPath = event.path || event.composedPath();
		console.log( 'eventPath', eventPath );
		if ( event.keyCode === UP || event.keyCode === DOWN ) {
			const areCursorsEqual = ( a, b ) => a.line === b.line; // && a.ch === b.ch
			if (
				lastCursor.current &&
				areCursorsEqual( instance.getCursor(), lastCursor.current )
			) {
				// document.activeElement.blur()
				// event.stopImmediatePropagation()
				if ( event.keyCode === UP ) {
					if ( showPanelRef.current === true ) {
						eventPath[ 3 ].querySelector( '.language' ).focus();
					} else {
						const rootEl =
							document.querySelector( '.is-root-container' );
						let roleEls =
							rootEl.querySelectorAll( '[role="document"]' );
						if ( ! roleEls.length ) {
							return;
						}
						roleEls.forEach( ( el, index ) => {
							if ( el.id === eventPath[ 4 ].id ) {
								let el = roleEls[ index - 1 ];
								el
									? el.focus()
									: document
											.querySelector(
												'.wp-block-post-title'
											)
											.focus();
								return;
							}
						} );
					}
				}
				if ( event.keyCode === DOWN ) {
					const rootEl =
						document.querySelector( '.is-root-container' );
					let roleEls =
						rootEl.querySelectorAll( '[role="document"]' );
					if ( ! roleEls.length ) {
						return;
					}
					roleEls.forEach( ( el, index ) => {
						if ( el.id === eventPath[ 4 ].id ) {
							let el = roleEls[ index + 1 ];
							el
								? el.focus()
								: insertBlocksAfter(
										createBlock( getDefaultBlockName() )
								  );
							return;
						}
					} );
				}

				// editor.current.blur()
				// editor.current.setOption("readOnly", true)
				// event.stopImmediatePropagation()
				// event.preventDefault()
			} else {
				lastCursor.current = instance.getCursor();
			}
		}

		// console.log(props);
		if ( event.ctrlKey && event.keyCode === 65 && selectAll ) {
			setSelectAll( false );
			event.stopImmediatePropagation();
		}
	};

	const updateFocus = () => {
		console.log( 'update focus' );
		if ( props.focus && ! editor.current.hasFocus() ) {
			// Need to wait for the next frame to be painted before we can focus the editor
			window.requestAnimationFrame( () => {
				editor.current.focus();
			} );
		}

		if ( ! props.focus && editor.current.hasFocus() ) {
			document.activeElement.blur();
		}
	};

	const onValueChange = ( editor, change ) => {
		if ( props.onChange && change.origin !== 'setValue' ) {
			let str = editor.getValue();
			props.onChange( str, change );
		}

		if ( props.onChange && change.origin === 'paste' ) {
			let str = editor.getValue();
			str = String( str )
				.replace( /“/g, '"' )
				.replace( /”/g, '"' )
				.replace( /‘/g, "'" )
				.replace( /’/g, "'" );
			props.onChange( str, change );
		}
	};

	// function focusNextBlock(offset) {
	//   const container = document.querySelector(".is-root-container");
	//   const regions = Array.from(
	//     container.querySelectorAll('[role="document"]'),
	//   );
	//   if (!regions.length) {
	//     return;
	//   }
	//   let nextRegion = regions[0];
	//   const selectedIndex = regions.indexOf(document.activeElement);
	//   if (selectedIndex !== -1) {
	//     let nextIndex = selectedIndex + offset;
	//     nextIndex = nextIndex === -1 ? regions.length - 1 : nextIndex;
	//     nextIndex = nextIndex === regions.length ? 0 : nextIndex;
	//     nextRegion = regions[nextIndex];
	//   }

	//   nextRegion.focus();
	// }

	return (
		<textarea
			ref={ editorRef }
			// autoFocus={props.autoFocus}
			autoComplete="off"
			defaultValue={ props.value }
			placeholder={ props.placeholder }
		/>
	);
}
