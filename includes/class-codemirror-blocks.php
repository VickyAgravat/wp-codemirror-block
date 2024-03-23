<?php

namespace CodeMirror_Blocks;

include_once 'class-settings.php';

defined('ABSPATH') || die;

/**
 * @package CodeMirror_Blocks/CodeMirror_Blocks
 *
 */
class CodeMirror_Blocks
{

  /**
   * @since 1.0.0
   * @access private
   * @static @var boolean
   *
   */
  private static $instance = null;

  /**
   * @since 1.0.0
   * @access private
   * @var array
   *
   */
  private $notice = [];

  /**
   * @since 1.1.0
   * @access private
   * @var string
   *
   */
  private static $suffix;

  /**
   * @since 1.0.0
   * @access private
   * @var string
   *
   */
  private static $plugin_version;

  /**
   * @since 1.0.0
   * @access private
   * @var const CODEMIRROR_VERSION
   *
   */
  const CODEMIRROR_VERSION = '5.40.5';

  /**
   * Constructor.
   *
   * @since 1.0.0
   */
  public function __construct()
  {
    add_action('init', array($this, 'init'));

    // enqueue styles and scripts

    // load after admin enqueue script
    add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
    add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'), 10);

    add_action('wp_enqueue_scripts', array($this, 'wp_enqueue_scripts'));

    // Add custom block category
    add_action('block_categories_all', array($this, 'block_categories_all'), 10, 2);

    new Settings();
  }

  /**
   * Create Singleton Instance of class
   *
   * @since 1.0.0
   *
   */
  public static function instance()
  {
    if (is_null(self::$instance)) {
      self::$instance = new self();
    }
    return self::$instance;
  }

  /**
   * Get Plugin Version
   *
   * @since 1.1.0
   *
   */
  public static function get_version()
  {
    return self::$plugin_version;
  }

  /**
   * @since 1.0.0
   */
  public function init()
  {

    /**
     * Registers the block using the metadata loaded from the `block.json` file.
     * Behind the scenes, it registers also all assets so they can be enqueued
     * through the block editor in the corresponding context.
     *
     * @see https://developer.wordpress.org/reference/functions/register_block_type/
     */
    register_block_type(CODEMIRROR_BLOCKS_PLUGIN_DIR . '/build', array(
      'editor_script' => 'codemirror-blocks-editor',
      'script' => 'codemirror-autoload',
      'view_script' => 'codemirror-view',
      'render_callback' => array($this, 'render_code_block')
    ));

    /**
     * Register all scripts and styles for the block editor
     */
    wp_register_script('codemirror', plugin_dir_url(CODEMIRROR_BLOCKS_PLUGIN) . 'vendor/codemirror/lib/codemirror.min.js', array(), self::CODEMIRROR_VERSION, true);

    wp_register_style('codemirror', plugin_dir_url(CODEMIRROR_BLOCKS_PLUGIN) . 'vendor/codemirror/lib/codemirror.min.css', array(), self::CODEMIRROR_VERSION);

    $auto_load_assets = require plugin_dir_path(CODEMIRROR_BLOCKS_PLUGIN) . '/build/autoload.asset.php';
    wp_register_script(
      'codemirror-autoload',
      plugin_dir_url(CODEMIRROR_BLOCKS_PLUGIN) . 'build/autoload.js',
      array('codemirror'),
      $auto_load_assets['version'],
      true
    );

    $index_assets = require plugin_dir_path(CODEMIRROR_BLOCKS_PLUGIN) . '/build/index.asset.php';
    wp_register_script(
      'codemirror-blocks-editor',
      plugins_url('/build/index.js',  CODEMIRROR_BLOCKS_PLUGIN),
      array_merge($index_assets['dependencies'], array('codemirror-autoload')),  // Merge Dependencies, defined above.
      $index_assets['version'],
      true
    );

    $view_assets = require plugin_dir_path(CODEMIRROR_BLOCKS_PLUGIN) . '/build/view.asset.php';
    wp_enqueue_script(
      'codemirror-view',
      plugin_dir_url(CODEMIRROR_BLOCKS_PLUGIN) . 'build/view.js',
      array_merge($view_assets['dependencies'], array('codemirror-autoload')),  // Merge Dependencies, defined above.
      $view_assets['version'],
      true
    );
  }

  /**
   * Enqueue block editor assets.
   *
   * @since 1.0.0
   */
  public function enqueue_block_editor_assets()
  {
    wp_enqueue_style('codemirror');

    wp_enqueue_script('codemirror-autoload');

    wp_add_inline_script('codemirror-autoload', self::inline_script('admin'), 'before');

    wp_enqueue_script('codemirror-blocks-editor');
  }

  /**
   * Enqueue admin styles and scripts.
   *
   * @since 1.0.0
   */
  public function admin_enqueue_scripts()
  {
  }

  /**
   * Enqueue Frontend styles and scripts.
   *
   * @since 1.0.0
   */
  public function wp_enqueue_scripts()
  {

    $content = get_post();

    if (empty($content)) {
      // if content is empty just simply return. no needs to enqueue anything.
      return;
    }

    $suffix = self::$suffix;

    $regex = "#wp-block-codemirror-blocks#";
    preg_match($regex, $content->post_content, $matches);

    if (is_home() || is_front_page()) {
      $enable_on_home = get_option('wpcm_setting_misc_enableOnHome');
      if ($enable_on_home == 'no')
        $matches = false;
    }
    // if( is_single() || is_page() ) {
    //     // $matches = false;
    //     // return;
    // }
    if ($matches) {
      // it is necessary to load codemirror first.
      wp_enqueue_style('codemirror');

      wp_enqueue_script('codemirror-autoload');

      wp_add_inline_script('codemirror-autoload', self::inline_script('frontend'), 'before');

      wp_enqueue_script('codemirror-view');
    }
  }

  /**
   * Add inline_script
   *
   * @since 1.1.0
   *
   * @return string Inline Script
   */
  public static function inline_script($view)
  {

    $options = Settings::get_options();
    $suffix = self::$suffix;

    $wpcm = [
      'plugin_url' => plugins_url("", CODEMIRROR_BLOCKS_PLUGIN),
      'assets' => [] //initializes empty array.
    ];

    if ($view == 'admin') {
      $wpcm['themes'] = Settings::themes();
      $wpcm['defaults'] = $options['editor'];
      $wpcm['panelOptions'] = $options['panel'];
      $wpcm['view'] = 'admin';
    }
    if ($view == 'frontend') {
      // $wpcm['options']['output'] = $options['output'];
      // $wpcm['options']['panel'] = $options['panel'];
      $wpcm['panelOptions'] = $options['panel'];
      $wpcm['editorOptions'] = [];
      if ($options['misc']['maxHeight']) {
        $wpcm['editorOptions']['maxHeight'] = '400px';
      }
      // $wpcm['json'] = $options;
      // for lazy loading
      // $wpcm['assets'][] = [
      //     'dir' => plugins_url("", CODEMIRROR_BLOCKS_PLUGIN) . '/vendor/codemirror/lib/',
      //     // 'js'  => 'codemirror.min.js',
      //     // 'css' => 'codemirror.min.css',
      //     'async' => true
      // ];
      // $js_version = filemtime(plugin_dir_path( CODEMIRROR_BLOCKS_PLUGIN ). '/assets/js/init' . $suffix . '.js');
      // $wpcm['assets'][] = [
      //     'dir' => plugins_url("", CODEMIRROR_BLOCKS_PLUGIN) . '/assets/',
      //     'js'  => 'js/init' . $suffix . '.js?v='.$js_version,
      //     // 'css' => 'blocks/blocks.style.build' . $suffix . '.css?v='.$css_version,
      //     'differ' => true
      // ];
      $wpcm['view'] = 'public';
    }

    $inline_script = 'var wpcm = ' . \wp_json_encode($wpcm, JSON_PRETTY_PRINT);

    return $inline_script;
  }

  /**
   * Add custom block category
   *
   * @since 2.0.0
   *
   * @param array $categories Gutenberg Block Categories.
   * @param object $post.
   * @return array $categories Modified Categories
   */
  public function block_categories_all($categories, $post)
  {
    return array_merge(
      $categories,
      array(
        array(
          'slug' => 'codemirror-blocks',
          'title' => __('CodeMirror Blocks', 'codemirror-blocks'),
        ),
      )
    );
  }


  /**
   * Renders CodeMirror Block.
   *
   * @since 1.1.0
   *
   * @param array $attributes CodeMirror Block attributes.
   * @param string $content   CodeMirror Block Content.
   * @return html             Modified CodeMirror Block.
   */
  public function render_code_block($attributes, $content, $block)
  {

    $editor_option = Settings::get_options();

    \ob_start();
    // echo '<pre>'.\json_encode($editor_option, JSON_PRETTY_PRINT ).'</pre><br />';
    $attributes = wp_parse_args($attributes, $editor_option['editor']);
    $attributes = wp_parse_args($attributes, $editor_option['panel']);
    // echo '<pre>'.\json_encode($block, JSON_PRETTY_PRINT ).'</pre><br />';
    // echo \json_encode($editor_option ).'<br /><br />';
    // echo '<pre>'.\json_encode($attributes, JSON_PRETTY_PRINT ).'</pre><br />';
    $modes = Settings::modes();
    $attributes['language'] = '';
    $attributes['maxHeight'] = '400px';
    foreach ($modes as $key => $mode) {
      if ($mode['mime'] == $attributes['mime']) {
        // $attributes['language'] = $mode['label'];
        // added fallback if fileName is not available.
        $attributes['language'] = preg_replace('/ \([\s\S]*?\)/', '', $mode['label']);
        $attributes['modeName'] = $mode['name'];
        break;
      }
    }
    // echo '<pre>'.\json_encode($attributes, JSON_PRETTY_PRINT ).'</pre><br />';

    if (!empty($content)) {

      $is_new_block = \strpos($content, '<pre>');

      // add extra %, to fix issue cause by sprintf, which escape single '%' symbol.
      $content = \str_ireplace('%', '%%', $content);

      if (!empty($is_new_block)) {
        // add class and data attribute.
        $content = \str_ireplace('<pre', '<pre class="CodeMirror" data-setting="%1$s"', $content);
      } else {
        // for backward compatibility.
        $content = preg_replace('/ data-setting="[\s\S]*?"/', ' data-setting="%1$s"', $content);
      }
      $content = sprintf($content, esc_attr(wp_json_encode($attributes, JSON_UNESCAPED_SLASHES)));
    } else if (!empty($attributes['content'])) {
      $content = $attributes['content'];
      unset($attributes['content']);
    }
    // NOTE: This is code block and it can not be escaped.
    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    echo $content;
    return \ob_get_clean();
  }
}
