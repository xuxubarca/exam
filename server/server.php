<?php

class WebsocketKnowledge {
    public $server;
    public $conn;
    public $rd;

    public function __construct() {
    	$this->conn = new MongoDB\Driver\Manager("mongodb://localhost:27017");
    	$this->rd = new Redis();
        $this->rd ->connect('127.0.0.1', 6379);

        $this->server = new swoole_websocket_server("0.0.0.0", 9502);
		$this->server->set(array(
			'worker_num' => 4,
			'daemonize' => false, // 作为守护进程
			'max_request' => 99999, //处理完超过此数值的任务后将自动退出，进程退出后会释放所有内存和资源
			'max_conn' => 3000, // 最大连接数
			//表示每90秒遍历一次，一个连接如果600秒内未向服务器发送任何数据，此连接将被强制关闭
	    	'heartbeat_check_interval' => 90, 
	   		'heartbeat_idle_time' => 600, 
			'backlog' => 2048, 

		));


        $this->server->on('open', array($this, 'open'));

        $this->server->on('message', array($this, 'message'));

        $this->server->on('close', array($this, 'close'));

        // $this->server->on('request', function ($request, $response) {
        //         // 接收http请求从get获取message参数的值，给用户推送
        //         // $this->server->connections 遍历所有websocket连接用户的fd，给所有用户推送
        //         foreach ($this->server->connections as $fd) {
        //             $this->server->push($fd, $request->get['message']);
        //         }
        //     });
        $this->server->start();

    }

   	public function open(swoole_websocket_server $server, $request){

		echo "server: 握手成功 fd{$request->fd}\n";
	}

	public function message(swoole_websocket_server $server, $frame){

		$request = $frame->data;
		$request = json_decode($request,true);

		$choosed_key = "choosed_{$frame->fd}";//已选题目
		$answer_key = "answer_{$frame->fd}";//已选题目
		echo json_encode($request);
		echo "\n";
		switch($request['type']){

			case 'login': // 登录
				$this->rd->delete($choosed_key); 
				$this->rd->delete($answer_key); 
				return;
			case 'start':
				$q_id = 1;
				$data = self::get_exam_questions($frame->fd,$q_id);
				$data = json_encode($data);
				$server->push($frame->fd, $data);
				return;
			case 'answer': // 答题
			 	$next_q_id = $request['q_id'] + 1;
				$data = self::get_exam_questions($frame->fd,$next_q_id);
				$data = json_encode($data);
		        $server->push($frame->fd, $data);
				return;
			default:
				return;
		}



	}

	public function close($server, $fd){
 		echo "client {$fd} closed\n";
	}


	// 从题库随机取题目
	public function get_exam_questions($fd,$q_id){

		$dbname = "test";
		$collname = "exam";
		$total = self::getCount($this->conn, $dbname, $collname);

		$choosed_key = "choosed_{$fd}";//已选题目
        $choosed = unserialize($this->rd->get($choosed_key));
        if(empty($choosed)){
        	$choosed = array();
        }
		
		mt_srand();
		$skip = mt_rand(0, $total-1);
		if(count($choosed) >= $total){
			return false; 
		}
		while(in_array($skip, $choosed)){
			mt_srand();
			$skip = mt_rand(0, $total-1);
		}
		$choosed[] = $skip;
		$this->rd ->set($choosed_key,serialize($choosed));

		$filter = array();
	 	$options = array('skip'=>$skip, 'limit'=>1);
	 	$query = new MongoDB\Driver\Query($filter, $options);
	 	$cursor = $this->conn->executeQuery($dbname.'.'.$collname, $query);

		$result = array();
	 	if($cursor){
	  		foreach($cursor as $v){
	   			$v = get_object_vars($v);
	   			unset($v['_id']);
	   			$result[] = $v;
	  		}
	 	}
	 	echo json_encode($choosed);
	 	echo "\n";
		$question = $result[0];


		$choosed_key = "choosed_{$fd}";//已选题目
		$answer_key = "answer_{$fd}";//已选题目
		

	 	$options = $question['options'];
	 	$options[] = $question['answer'];
		mt_srand();
		shuffle($options);
		$true_answer = array_search($question['answer'],$options);

		$this->rd->hset($answer_key,$q_id,$true_answer);

		$data = array();
		$data['type'] = 'question';
		$data['q_id'] = $q_id;
		$data['question'] = $question['question'];
		$data['options'] = $options;

	 	return $data;
	}

	// 获取总记录数
	public function getCount($conn, $dbname, $collname){
		$cmd = array(
	  		'count' => $collname,
	  		'query' => array()
	 	);
	 	$command = new MongoDB\Driver\Command($cmd);
	 	$result = $conn->executeCommand($dbname, $command);
	 	$response = current($result->toArray());
	 	if($response->ok==1){
	  		return $response->n;
	 	}
	 	return 0;
	}

	
}



new WebsocketKnowledge();

?>