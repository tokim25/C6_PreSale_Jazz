<html>
<head>
	<?
		$appLoc = $_GET['location'] . ' : ' . $_GET['module'];
		if(!isset($_GET['email'])){
			$_GET['email'] = '';
		}
		if(!isset($_GET['name'])){
			$_GET['name'] = '';
		}
		if(!isset($_GET['location'])){
			$_GET['location'] = '';
		}

	?>
</head>
<body>

<script type="text/javascript" src="GET THIS FROM THE JIRA ISSUE COLLECTOR ADMIN"></script>
<script type="text/javascript">
	var launchTrigger;

	function popup(){
		launchTrigger();
		setInterval(watchForClose, 33)
	}
	function watchForClose(){
		if($('#atlwdg-frame').length == 0){
			window.self.close();
		}
	}

	window.ATL_JQ_PAGE_PROPS =  {

		fieldValues: {
			email : '<?= $_GET['email']; ?>',
			fullname : '<?= $_GET['name']; ?>',
			//applocation: '<?= $appLoc; ?>',
			customfield_10026 : '<?= $appLoc; ?>'.replace('?appLoc=', '')
		},
		environment : function(){
			var env_info = {};
<?		foreach($_GET as $param=>$val){
			if($param != 'name' && $param != 'email'){
	?>
			env_info['<?= $param; ?>'] = '<?= $val; ?>';
<?			}
		}	?>

			return env_info;
		},
		"triggerFunction": function(showCollectorDialog) {
				launchTrigger= showCollectorDialog;

				setTimeout(popup, 50);
			/*
			$('#trigger').click(function(e) {
				console.log('load');
				e.preventDefault();
				showCollectorDialog();
			});*/
	}};

	window.resizeTo(820, 640);
</script>
</body>
</html>