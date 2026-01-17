<form action="upload.php" method="post" enctype="multipart/form-data"
      class="bg-white p-6 rounded shadow w-1/2">

    <input type="hidden" name="customer_id" value="<?= $customer_id ?>">

    <input type="file" name="photo"
           class="border p-2 w-full mb-4">

    <button class="bg-green-500 text-white px-4 py-2 rounded">
        Upload
    </button>
</form>
