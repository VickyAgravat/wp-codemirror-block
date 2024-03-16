<?php

/**
 * Plugin Name:			  CodeMirror Blocks
 * Plugin URI:			  https://wordpress.org/plugins/wp-codemirror-block/
 * Description:				It provides Code Block. it can be use as (syntax highlighter) built with CodeMirror library, it is use full for developers or tutorials blog to display highlighted code, with Web Editor.
 * Requires at least: 6.0
 * Requires PHP:      7.0
 * Version:						2.0.0
 * Author:      			Vicky Agravat
 * Author URI:  			https://profiles.wordpress.org/vickyagravat
 * License:     			GPL-2.0-or-later
 * License URI: 			http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: 			codemirror-blocks
 * @package 					CodeMirror_Blocks
 */

defined('ABSPATH') || die;

if (!defined('CODEMIRROR_BLOCKS_PLUGIN')) {
  define('CODEMIRROR_BLOCKS_PLUGIN', __FILE__);
}
if (!defined('CODEMIRROR_BLOCKS_PLUGIN_DIR')) {
  define('CODEMIRROR_BLOCKS_PLUGIN_DIR', __DIR__);
}

include('includes/class-codemirror-blocks.php');
CodeMirror_Blocks\CodeMirror_Blocks::instance();

include('tinymce/class-tinymce.php');
