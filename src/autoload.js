if ( 'undefined' === typeof window.wpcm ) {
	window.wpcm = {};
}
if ( 'undefined' === typeof window.wpcm.codeEditor ) {
	window.wpcm.codeEditor = {};
}
function loadError( e ) {
	if ( e.target.src ) {
		throw new URIError(
			'The script ' + e.target.src + " didn't load correctly."
		);
	}
	if ( e.target.href ) {
		throw new URIError(
			'The style ' + e.target.href + " didn't load correctly."
		);
	}
}
function loadSuccess( e ) {
	if ( e.target.src ) {
		console.info( 'The script ' + e.target.src + ' loaded.' );
	}
	if ( e.target.href ) {
		console.info( 'The style ' + e.target.href + ' loaded.' );
	}
}

function wp_enqueue_script( asset ) {
	let script = document.createElement( 'script' );
	script.onerror = loadError;
	script.onload = loadSuccess;

	if ( asset.differ ) {
		script.defer = true;
	}
	if ( asset.async ) {
		script.async = true;
	}
	script.type = 'text/javascript';

	// document.currentScript.parentNode.insertBefore(script, document.currentScript);
	script.src = asset.dir + asset.js;
	document.body.appendChild( script );
}

function wp_enqueue_style( asset ) {
	let link = document.createElement( 'link' );
	link.onerror = loadError;
	link.onload = loadSuccess;

	link.rel = 'stylesheet';
	// link.rel = 'preload';

	// document.currentScript.parentNode.insertBefore(link, document.currentScript);
	document.head.appendChild( link );
	link.href = asset.dir + asset.css;
}

assets = wpcm.assets;

function loadAssets( assets ) {
	for ( let i = 0; i < assets.length; i++ ) {
		if ( assets[ i ].js ) {
			wp_enqueue_script( assets[ i ] );
		}
		if ( assets[ i ].css ) {
			wp_enqueue_style( assets[ i ] );
		}
	}
	let event = new CustomEvent( 'wpcm_assets_loaded' );
	document.dispatchEvent( event );
}

document.addEventListener( 'DOMContentLoaded', function ( event ) {
	console.log( 'doc ready' );
	let codeBlocks = document.querySelectorAll(
		'.code-block > pre.CodeMirror'
	);
	if ( codeBlocks.length > 0 || wpcm.view == 'admin' ) {
		loadAssets( assets );
	}
} );

( function ( CodeMirror, wpcm ) {
	// CodeMirror library url
	let codemirror_url = wpcm.plugin_url + '/vendor/codemirror/';
	if ( ! CodeMirror.codemirrorURL )
		CodeMirror.codemirrorURL = codemirror_url + '%D/%F';
	if ( ! CodeMirror.modeURL )
		CodeMirror.modeURL = codemirror_url + 'mode/%N/%N.js';
	if ( ! CodeMirror.addonURL )
		CodeMirror.addonURL = codemirror_url + '/addon/%D/%N.js';

	let loading = {};
	function splitCallback( cont, n ) {
		let countDown = n;
		return function () {
			if ( --countDown == 0 ) cont();
		};
	}
	function ensureDeps( mode, cont ) {
		let deps = CodeMirror.modes[ mode ].dependencies;
		if ( ! deps ) return cont();
		let missing = [];
		for ( let i = 0; i < deps.length; ++i ) {
			if ( ! CodeMirror.modes.hasOwnProperty( deps[ i ] ) )
				missing.push( deps[ i ] );
		}
		if ( ! missing.length ) return cont();
		let split = splitCallback( cont, missing.length );
		for ( let i = 0; i < missing.length; ++i )
			CodeMirror.requireMode( missing[ i ], split );
	}

	CodeMirror.requireMode = function ( mode, cont ) {
		if ( typeof mode != 'string' ) mode = mode.name;
		if ( CodeMirror.modes.hasOwnProperty( mode ) )
			return ensureDeps( mode, cont );
		if ( loading.hasOwnProperty( mode ) )
			return loading[ mode ].push( cont );

		let file = CodeMirror.modeURL.replace( /%N/g, mode );
		let script = document.createElement( 'script' );
		script.src = file;
		console.log( 'required mode', file );
		let others = document.getElementsByTagName( 'script' )[ 0 ];
		let list = ( loading[ mode ] = [ cont ] );
		CodeMirror.on( script, 'load', function () {
			ensureDeps( mode, function () {
				for ( let i = 0; i < list.length; ++i ) list[ i ]();
			} );
		} );
		others.parentNode.insertBefore( script, others );
	};

	CodeMirror.autoLoadMode = function ( instance, mode ) {
		if ( ! CodeMirror.modes.hasOwnProperty( mode ) )
			CodeMirror.requireMode( mode, function () {
				instance.setOption( 'mode', instance.getOption( 'mode' ) );
			} );
	};

	// added custom required functions
	CodeMirror.loaderSVG = function ( element, link ) {
		let svgns = 'http://www.w3.org/2000/svg',
			xlinkns = 'http://www.w3.org/1999/xlink',
			svg = document.createElementNS( svgns, 'svg' ),
			path = document.createElementNS( svgns, 'path' ),
			use = document.createElementNS( svgns, 'use' );

		svg.setAttribute( 'class', 'loader' );
		svg.setAttribute( 'viewBox', '-2000 -1000 4000 2000' );
		path.setAttribute( 'id', 'inf' );
		path.setAttribute(
			'd',
			'M354-354A500 500 0 1 1 354 354L-354-354A500 500 0 1 0-354 354z'
		);
		use.setAttributeNS( xlinkns, 'xlink:href', '#inf' );
		use.setAttribute( 'stroke-dasharray', '1570 5143' );
		use.setAttribute( 'stroke-dashoffset', '6713px' );
		svg.appendChild( path );
		svg.appendChild( use );

		element.appendChild( svg );

		CodeMirror.on( link, 'load', function () {
			element.querySelector( 'svg' ).remove();
		} );
	};

	CodeMirror.enqueueStyle = function ( fileName, dirName = 'theme' ) {
		let _id = 'CodeMirror-' + dirName + '-' + fileName + '-css',
			_href =
				CodeMirror.codemirrorURL
					.replace( /%D/g, dirName )
					.replace( /%F/g, fileName ) + '.css',
			isLoaded = document.getElementById( _id );

		// console.log(_id, _href, isLoaded);

		if ( isLoaded == undefined ) {
			let head = document.getElementsByTagName( 'head' )[ 0 ];
			let link = document.createElement( 'link' );
			link.rel = 'stylesheet';
			link.id = _id;
			link.href = _href;

			link.onerror = loadError;
			link.onload = loadSuccess;

			head.appendChild( link );
			return link;
		}
		return;
	};

	CodeMirror.enqueueScript = function ( fileName, dirName = 'mode' ) {
		let _id = 'CodeMirror-' + dirName + '-' + fileName,
			_src =
				CodeMirror.codemirrorURL
					.replace( /%D/g, dirName )
					.replace( /%F/g, fileName ) + '.js',
			isLoaded = document.getElementById( _id );

		// console.log(_id, _src, isLoaded);

		if ( isLoaded == undefined ) {
			let script, scripts;

			script = document.createElement( 'script' );
			script.src = _src;
			script.id = _id;

			script.onerror = loadError;
			script.onload = loadSuccess;

			scripts = document.getElementsByTagName( 'script' )[ 0 ];
			scripts.parentNode.insertBefore( script, scripts );

			return script;
		}
		return;
	};

	CodeMirror.autoLoadTheme = function ( editor, theme ) {
		if ( theme == 'default' ) {
			return;
		}
		let link = CodeMirror.enqueueStyle( theme, 'theme' );
		if ( link ) {
			CodeMirror.loaderSVG( editor.display.wrapper, link );
		}
	};
} )( window.CodeMirror, window.wpcm );
