
$serverApi = new ServerApi(ServerApi::V1);
$client = new MongoDB\Client(
    'mongodb+srv://Meet:<password>@cluster0.tviiu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', [], ['serverApi' => $serverApi]);

$db = $client->test;
