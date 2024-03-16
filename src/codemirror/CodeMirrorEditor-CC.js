/**
 * WordPress dependencies
 */
// import { Component } from '@wordpress/element';
// import { UP, DOWN } from '@wordpress/keycodes';

// https://github.com/WordPress/gutenberg/blob/3.8/components/code-editor/editor.js

const { Component } = wp.element;

const { UP, DOWN } = wp.keycodes;

const { CodeMirror } = window;

class CodeMirrorEditor extends Component {
	constructor() {
		super( ...arguments );

		this.selectAll = true;

		this.onBlur = this.onBlur.bind( this );
		this.onValueChange = this.onValueChange.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onCursorActivity = this.onCursorActivity.bind( this );
		this.onKeyHandled = this.onKeyHandled.bind( this );
	}

	componentDidMount() {
		this.editor = CodeMirror.fromTextArea(
			this.textarea,
			this.props.options
		);

		let wrapper = this.editor.getWrapperElement();
		if ( this.props.hasPanel === true ) {
			wrapper.classList.add( 'has-panel' );
		}

		this.editor.setOption( 'mode', this.props.options.mime );

		CodeMirror.autoLoadTheme( this.editor, this.props.options.theme );

		if ( this.props.options.mode ) {
			CodeMirror.autoLoadMode( this.editor, this.props.options.mode );
		}

		this.editor.on( 'blur', this.onBlur );
		this.editor.on( 'change', this.onValueChange );
		this.editor.on( 'cursorActivity', this.onCursorActivity );
		this.editor.on( 'focus', this.onFocus );
		this.editor.on( 'keyHandled', this.onKeyHandled );

		// Pass a reference to the editor back up.
		if ( this.props.editorRef ) {
			this.props.editorRef( this.editor );
		}

		this.updateFocus();
	}

	componentWillUnmount() {
		this.editor.off( 'blur', this.onBlur );
		this.editor.off( 'change', this.onValueChange );
		this.editor.off( 'cursorActivity', this.onCursorActivity );
		this.editor.off( 'focus', this.onFocus );
		this.editor.off( 'keyHandled', this.onKeyHandled );
		this.selectAll = null;
		if ( this.editor ) {
			this.editor.toTextArea();
		}
	}

	// componentDidUpdate(prevProps, prevState, snapshot) {
	componentDidUpdate( prevProps ) {
		// update value if changed
		if (
			this.props.value !== prevProps.value &&
			this.editor.getValue() !== this.props.value
		) {
			this.editor.setValue( this.props.value );
		}

		// update option if changed
		if ( typeof prevProps.options === 'object' ) {
			for ( let optionName in prevProps.options ) {
				if ( prevProps.options.hasOwnProperty( optionName ) ) {
					if (
						prevProps.options[ optionName ] !==
						this.props.options[ optionName ]
					) {
						this.setOptionIfChanged(
							optionName,
							this.props.options[ optionName ],
							this.props.options
						);
					}
				}
			}
		}

		let wrapper = this.editor.getWrapperElement();
		if ( this.props.hasPanel === true ) {
			wrapper.classList.add( 'has-panel' );
		} else {
			wrapper.classList.remove( 'has-panel' );
		}

		if ( this.props.focus !== prevProps.focus ) {
			this.updateFocus();
		}
	}

	setOptionIfChanged( optionName, newValue, options ) {
		// console.log("optionName", optionName);
		// console.log("newValue", newValue);
		this.editor.setOption( optionName, newValue );
		if ( optionName == 'theme' ) {
			CodeMirror.autoLoadTheme( this.editor, newValue );
		}
		if ( optionName == 'mode' ) {
			this.editor.setOption( 'mode', options.mime );
			CodeMirror.autoLoadMode( this.editor, options.mode );
			// this.setState({mode: newValue});
			// this.forceUpdate();
		}
	}

	onFocus() {
		if ( this.props.onFocus ) {
			this.props.onFocus();
		}
	}

	onBlur( editor ) {
		if ( this.props.onChange ) {
			this.props.onChange( editor.getValue() );
		}
		this.selectAll = true;
	}

	onCursorActivity( editor ) {
		this.lastCursor = editor.getCursor();
	}

	onKeyHandled( editor, name, event ) {
		/*
		 * Pressing UP/DOWN should only move focus to another block if the cursor is
		 * at the start or end of the editor.
		 *
		 * We do this by stopping UP/DOWN from propagating if:
		 *  - We know what the cursor was before this event; AND
		 *  - This event caused the cursor to move
		 */
		if ( event.keyCode === UP || event.keyCode === DOWN ) {
			const areCursorsEqual = ( a, b ) =>
				a.line === b.line && a.ch === b.ch;
			if (
				this.lastCursor &&
				! areCursorsEqual( editor.getCursor(), this.lastCursor )
			) {
				event.stopImmediatePropagation();
			}
		}

		// console.log(this.props);
		if ( event.ctrlKey && event.keyCode === 65 && this.selectAll ) {
			this.selectAll = false;
			event.stopImmediatePropagation();
		}
	}

	updateFocus() {
		if ( this.props.focus && ! this.editor.hasFocus() ) {
			// Need to wait for the next frame to be painted before we can focus the editor
			window.requestAnimationFrame( () => {
				this.editor.focus();
			} );
		}

		if ( ! this.props.focus && this.editor.hasFocus() ) {
			document.activeElement.blur();
		}
	}

	onValueChange( editor, change ) {
		if ( this.props.onChange && change.origin !== 'setValue' ) {
			let str = editor.getValue();
			this.props.onChange( str, change );
		}

		if ( this.props.onChange && change.origin === 'paste' ) {
			let str = editor.getValue();
			str = String( str )
				.replace( /“/g, '"' )
				.replace( /”/g, '"' )
				.replace( /‘/g, "'" )
				.replace( /’/g, "'" );
			this.props.onChange( str, change );
		}
	}

	render() {
		return (
			<textarea
				ref={ ( ref ) => ( this.textarea = ref ) }
				autoFocus={ this.props.autoFocus }
				autoComplete="off"
				defaultValue={ this.props.value }
				placeholder={ this.props.placeholder }
			/>
		);
	}
}

export default CodeMirrorEditor;
