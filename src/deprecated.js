// https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { RichText } from '@wordpress/block-editor';

//  const { RichText } = wp.blockEditor

const blockAttributes = {
	panel: {
		type: 'boolean',
		default: true,
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
	alignment: {
		type: 'string',
	},
	mode: {
		type: 'string',
		default: 'htmlmixed',
	},
	mime: {
		type: 'string',
		default: 'text/html',
	},
	lineNumbers: {
		type: 'boolean',
		default: false,
	},
	firstLineNumber: {
		type: 'number',
		default: 1,
	},
	lineWrapping: {
		type: 'boolean',
		default: false,
	},
	readOnly: {
		type: 'boolean',
		default: true,
	},
	disableCopy: {
		type: 'boolean',
		default: false,
	},
	theme: {
		type: 'string',
		default: 'material', //'default'
	},
};

const deprecated = [
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const {
				content,
				mode,
				mime,
				lineNumbers,
				lineWrapping,
				readOnly,
				disableCopy,
				theme,
			} = attributes;
			let preClassName = 'CodeMirror cm-s-' + theme;

			// convert html entity for display symbol.
			const htmlEntities = ( str ) => {
				return String( str )
					.replace( /&/g, '&amp;' )
					.replace( /</g, '&lt;' )
					.replace( />/g, '&gt;' )
					.replace( /"/g, '&quot;' );
			};
			let blockSetting = {
				mode: mode,
				mime: mime,
				theme: theme,
				lineNumbers: lineNumbers,
				lineWrapping: lineWrapping,
				readOnly:
					readOnly == true
						? disableCopy == true
							? 'nocursor'
							: true
						: false,
			};
			return (
				<div className="code-block">
					<RichText.Content
						className={ preClassName }
						data-setting={ JSON.stringify( blockSetting ) }
						tagName="pre"
						value={ htmlEntities( content ) }
					/>
				</div>
			);
		},
	},
];

export default deprecated;
