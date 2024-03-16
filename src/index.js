/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * Registers a new block provided a unique name and an object defining its behavior.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
import { registerBlockType, createBlock } from '@wordpress/blocks';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * All files containing `style` keyword are bundled together. The code used
 * gets applied both to the front of your site and to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './style.scss';

/**
 * Internal dependencies
 */
import Edit from './edit';
import save from './save';
import metadata from './block.json';
import deprecated from './deprecated.js';

const { panelOptions, defaults } = window.wpcm;

/**
 * Every block starts by registering a new block type definition.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
registerBlockType( metadata.name, {
	attributes: {
		/* panel options*/
		showPanel: {
			type: 'boolean',
			default: panelOptions?.showPanel || false,
		},
		showLanguageLabel: {
			type: 'boolean',
			default: panelOptions?.showLanguageLabel || false,
		},
		languageLabel: {
			type: 'string',
			default:
				panelOptions?.languageLabel === false
					? 'no'
					: panelOptions?.languageLabel,
		},
		fileName: {
			type: 'string',
			default: '',
		},
		content: {
			type: 'array',
			source: 'children',
			selector: 'pre',
		},
		mode: {
			type: 'string',
			default: '', //defaults?.mode || 'htmlmixed'
		},
		mime: {
			type: 'string',
			default: '', //defaults?.mime || 'text/html'
		},
		lineNumbers: {
			type: 'boolean',
			default: defaults?.lineNumbers || false,
		},
		firstLineNumber: {
			type: 'string',
			default: Math.abs( 1 ),
		},
		lineWrapping: {
			type: 'boolean',
			default: defaults?.lineWrapping || false,
		},
		readOnly: {
			type: 'boolean',
			default: defaults?.readOnly || false,
		},
		styleActiveLine: {
			type: 'boolean',
			default: defaults?.styleActiveLine || false,
		},
		disableCopy: {
			type: 'boolean',
			default: false,
		},
		theme: {
			type: 'string',
			default: defaults?.theme || 'material', //'default'
		},
	},
	// Register block styles.
	// styles: [
	// 	// Mark style as default.
	// 	{
	// 		name: 'default',
	// 		label: __('Rounded'),
	// 		isDefault: true
	// 	},
	// 	{
	// 		name: 'outline',
	// 		label: __('Outline')
	// 	},
	// 	{
	// 		name: 'squared',
	// 		label: __('Squared')
	// 	},
	// ],
	// Don't allow the block to be converted into a reusable block.
	// reusable: false,
	// Remove the support for the generated className.
	// className: false,
	// Remove the support for the custom className.
	// customClassName: false,
	transforms: {
		from: [
			{
				type: 'raw',
				priority: 4,
				isMatch: ( element ) => {
					return (
						'PRE' === element.nodeName &&
						1 === element.children.length &&
						'CODE' === element.firstChild.nodeName
					);
				},
				transform: ( element ) => {
					return createBlock( 'codemirror-blocks/code-block', {
						content: element.textContent,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/code', 'core/preformatted', 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'codemirror-blocks/code-block', {
						content,
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/code' ],
				transform: ( { content } ) => {
					return createBlock( 'core/code', {
						content,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/preformatted' ],
				transform: ( { content } ) => {
					return createBlock( 'core/preformatted', {
						content,
					} );
				},
			},
		],
	},
	/**
	 * @see ./edit.js
	 */
	edit: Edit,

	/**
	 * @see ./save.js
	 */
	save,
	deprecated,
} );
