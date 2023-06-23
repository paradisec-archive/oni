<template>
  <div class="min-w-full pb-4 pt-0 px-2 pl-4">
    <div class="bg-white z-10">
    </div>
    <el-row :gutter="40" :offset="1" class="flex flex-row h-[calc(100vh-220px)] overflow-auto">
        <p class="text-gray-500 mb-3"></p>
        <div class="p-4 px-4 md:p-8 mb-6">
          <div class="text-sm grid-cols-1 lg:grid-cols-3">
            <div class="text-gray-600">
              <div class="p-2">
                <p class="font-medium text-2xl">About</p>
              </div>
              <div class="p-2">
                <p class="font-medium text-lg" v-html="help.aboutText"></p>
              </div>
              <div class="p-2">
                <p class="font-medium text-lg" v-html="help.citationText"></p>
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 px-4 md:p-8 mb-3">
          <div class="text-sm grid-cols-1 lg:grid-cols-3">
            <div class="text-gray-600">
              <div class="p-2">
                <p class="font-medium text-2xl">Oni</p>
              </div>
              <div class="p-2">
                <p class="font-medium text-lg">This portal was built with <a class='underline'
                                                                             href="https://github.com/Arkisto-Platform/oni">Oni</a>
                  part of the <a class='underline' href="https://arkisto-platform.github.io">Arkisto-Platform</a>.
                  Indexing and searching secure data repositories - <a class='underline' href="https://www.elastic.co">Elastic
                    Search</a> based on open standards for research object metadata - <a class='underline'
                                                                                         href="https://www.researchobject.org">RO-Crate</a>
                  and file based repositories - <a class='underline' href="https://ocfl.io">OCFL</a></p>
              </div>
              <div class="p-2">
                <p class="font-medium text-lg">Authorization is federated by <a class='underline'
                                                                                href="https://ca.cilogon.org">CILogon</a>
                  and access management with <a class='underline' href="https://github.com/CSCfi/rems">REMS - Resource
                    Entitlement Management System</a></p>
              </div>
              <p></p>
            </div>
          </div>
        </div>
        <div class="p-4 px-4 md:p-8 mb-3">
          <div class="text-sm grid-cols-1 lg:grid-cols-3">
            <div class="text-gray-600">
              <div class="p-2">
                <p class="font-medium text-2xl">Api</p>
              </div>
              <div class="p-2">
                <p class="font-medium text-lg">Oni's backend can also be accessed via the ReST API endpoint at <a
                    target="_blank" rel="nofollow noreferrer" href="/api/">/api</a> which is documented using Swaggger's OpenAPI </p>
              </div>
              <div class="p-2">
                <p class="font-medium text-lg"><a class="underline" href="/docs">Oni API Docs</a></p>
              </div>
            </div>
          </div>
        </div>
    </el-row>
  </div>
</template>

<script>

export default {
  data() {
    return {
      help: this.$store.state.configuration.ui.help,
    }
  },
  mounted() {
  }
};
</script>
